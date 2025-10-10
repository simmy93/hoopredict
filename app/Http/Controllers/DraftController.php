<?php

namespace App\Http\Controllers;

use App\Events\DraftCompleted;
use App\Events\DraftStarted;
use App\Events\PlayerDrafted;
use App\Jobs\AutoPickJob;
use App\Models\DraftPick;
use App\Models\FantasyLeague;
use App\Models\Player;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DraftController extends Controller
{
    public function show(FantasyLeague $league)
    {
        if ($league->mode !== 'draft') {
            return redirect()->route('fantasy.leagues.show', $league);
        }

        $userTeam = $league->teams()->where('user_id', auth()->id())->first();

        if (!$userTeam) {
            return redirect()->route('fantasy.leagues.show', $league)
                ->with('error', 'You are not a member of this league');
        }

        // Get all teams ordered by draft order
        $teams = $league->teams()
            ->with('user')
            ->orderBy('draft_order')
            ->get();

        // Check for expired pick and auto-draft BEFORE loading other data
        if ($league->isPickExpired()) {
            $currentTeam = $league->getCurrentDraftTeam();
            if ($currentTeam) {
                $this->performAutoPick($league, $currentTeam);
                // Reload the league to get updated current_pick
                $league->refresh();
            }
        }

        // Get all draft picks (after potential auto-pick)
        $draftPicks = $league->draftPicks()
            ->with(['team.user', 'player'])
            ->orderBy('pick_number')
            ->get();

        // Get available players
        $draftedPlayerIds = $draftPicks->pluck('player_id')->toArray();

        $availablePlayers = Player::with('team')
            ->where('is_active', true)
            ->whereNotIn('id', $draftedPlayerIds)
            ->whereHas('team', function($q) use ($league) {
                $q->where('championship_id', $league->championship_id);
            })
            ->orderBy('price', 'desc')
            ->get();

        // Get current team on the clock
        $currentTeam = $league->getCurrentDraftTeam();
        if ($currentTeam) {
            $currentTeam->load('user');
        }

        // Calculate endTime and serverTime (like countdown example)
        $pickStartedAt = $league->pick_started_at?->valueOf();
        $endTime = $pickStartedAt ? $pickStartedAt + ($league->pick_time_limit * 1000) : null;
        $serverTime = now()->valueOf();

        return Inertia::render('Fantasy/Draft/Show', [
            'league' => $league->load('owner', 'championship'),
            'userTeam' => $userTeam,
            'teams' => $teams,
            'draftPicks' => $draftPicks,
            'availablePlayers' => $availablePlayers,
            'currentTeam' => $currentTeam,
            'isMyTurn' => $currentTeam && $currentTeam->id === $userTeam->id,
            'endTime' => $endTime,
            'serverTime' => $serverTime,
        ]);
    }

    public function start(FantasyLeague $league)
    {
        if ($league->mode !== 'draft') {
            return back()->with('error', 'This is not a draft league');
        }

        if ($league->owner_id !== auth()->id()) {
            return back()->with('error', 'Only the league owner can start the draft');
        }

        if ($league->draft_status !== 'pending') {
            return back()->with('error', 'Draft has already been started');
        }

        // Check if at least 2 members have joined
        $memberCount = $league->teams()->count();
        if ($memberCount < 2) {
            return back()->with('error', 'At least 2 members are required to start the draft');
        }

        $league->generateDraftOrder();

        // Broadcast draft started event
        broadcast(new DraftStarted($league));

        // Schedule auto-pick job for the first pick
        $this->scheduleAutoPickJob($league);

        return redirect()->route('fantasy.draft.show', $league)
            ->with('success', 'Draft has started!');
    }

    public function pick(FantasyLeague $league, Request $request)
    {
        $request->validate([
            'player_id' => 'required|exists:players,id',
        ]);

        if ($league->mode !== 'draft' || $league->draft_status !== 'in_progress') {
            return back()->with('error', 'Draft is not in progress');
        }

        $userTeam = $league->teams()->where('user_id', auth()->id())->first();

        if (!$userTeam) {
            return back()->with('error', 'You are not a member of this league');
        }

        $player = Player::findOrFail($request->player_id);

        try {
            $pick = \DB::transaction(function () use ($league, $userTeam, $player) {
                // Lock the league row to prevent concurrent picks
                $league = FantasyLeague::where('id', $league->id)
                    ->lockForUpdate()
                    ->first();

                // Re-check current team after acquiring lock
                $currentTeam = $league->getCurrentDraftTeam();

                if (!$currentTeam || $currentTeam->id !== $userTeam->id) {
                    throw new \Exception('It is not your turn to pick');
                }

                // Check if player already drafted
                if ($league->draftPicks()->where('player_id', $player->id)->exists()) {
                    throw new \Exception('Player has already been drafted');
                }

                // Check if team is full
                if ($userTeam->isFull()) {
                    throw new \Exception('Your team is full');
                }

                // Store current pick number before incrementing
                $currentPickNumber = $league->current_pick;
                $totalTeams = $league->teams()->count();
                $currentRound = (int)ceil($currentPickNumber / $totalTeams);

                // Create draft pick
                $pick = DraftPick::create([
                    'fantasy_league_id' => $league->id,
                    'fantasy_team_id' => $userTeam->id,
                    'player_id' => $player->id,
                    'pick_number' => $currentPickNumber,
                    'round' => $currentRound,
                    'created_at' => now(),
                ]);

                // Add player to team
                $userTeam->draftPlayer($player);

                // Increment pick counter and reset timer
                $league->update([
                    'current_pick' => $currentPickNumber + 1,
                    'pick_started_at' => now()
                ]);

                return $pick;
            });

            // Reload league after transaction
            $league->refresh();

            // Broadcast player drafted event
            broadcast(new PlayerDrafted($league, $pick));

            // Check if draft is complete
            if ($league->isDraftComplete()) {
                $league->update(['draft_status' => 'completed']);
                broadcast(new DraftCompleted($league));
                return redirect()->route('fantasy.leagues.show', $league)
                    ->with('success', 'Draft completed!');
            }

            // Schedule auto-pick job for next pick
            $this->scheduleAutoPickJob($league);

            return back()->with('success', "You drafted {$player->name}!");
        } catch (\Exception $e) {
            \Log::error("Draft pick failed: " . $e->getMessage());
            return back()->with('error', $e->getMessage());
        }
    }

    public function performAutoPick(FantasyLeague $league, $team): void
    {
        try {
            $pick = \DB::transaction(function () use ($league, $team) {
                // Lock the league row to prevent concurrent picks
                $league = FantasyLeague::where('id', $league->id)
                    ->lockForUpdate()
                    ->first();

                // Verify draft is still in progress
                if ($league->draft_status !== 'in_progress') {
                    \Log::info("Auto-pick aborted: draft not in progress");
                    return null;
                }

                // Get available players
                $draftedPlayerIds = $league->draftPicks()->pluck('player_id')->toArray();

                $player = Player::where('is_active', true)
                    ->whereNotIn('id', $draftedPlayerIds)
                    ->whereHas('team', function($q) use ($league) {
                        $q->where('championship_id', $league->championship_id);
                    })
                    ->orderBy('price', 'desc')
                    ->first();

                if (!$player) {
                    \Log::warning("No available players for auto-pick");
                    return null;
                }

                // Store current pick number before incrementing
                $currentPickNumber = $league->current_pick;
                $totalTeams = $league->teams()->count();
                $currentRound = (int)ceil($currentPickNumber / $totalTeams);

                // Create draft pick
                $pick = DraftPick::create([
                    'fantasy_league_id' => $league->id,
                    'fantasy_team_id' => $team->id,
                    'player_id' => $player->id,
                    'pick_number' => $currentPickNumber,
                    'round' => $currentRound,
                    'created_at' => now(),
                ]);

                // Add player to team
                $team->draftPlayer($player);

                // Increment pick counter and reset timer
                $league->update([
                    'current_pick' => $currentPickNumber + 1,
                    'pick_started_at' => now()
                ]);

                return $pick;
            });

            if (!$pick) {
                return;
            }

            // Reload league after transaction
            $league->refresh();

            // Broadcast auto-pick event
            broadcast(new PlayerDrafted($league, $pick));

            // Check if draft is complete
            if ($league->isDraftComplete()) {
                $league->update(['draft_status' => 'completed']);
                broadcast(new DraftCompleted($league));
            } else {
                // Schedule auto-pick job for next pick
                $this->scheduleAutoPickJob($league);
            }
        } catch (\Exception $e) {
            \Log::error("Auto-pick failed: " . $e->getMessage());
        }
    }

    private function scheduleAutoPickJob(FantasyLeague $league): void
    {
        \Log::info("scheduleAutoPickJob called for league {$league->id}, pick {$league->current_pick}");

        if (!$league->pick_started_at || $league->draft_status !== 'in_progress') {
            \Log::warning("Cannot schedule job. pick_started_at: {$league->pick_started_at}, status: {$league->draft_status}");
            return;
        }

        $pickStartedAt = $league->pick_started_at->valueOf();
        $endTime = $pickStartedAt + ($league->pick_time_limit * 1000);
        $nowMs = now()->valueOf();
        $delayInSeconds = max(0, ($endTime - $nowMs) / 1000);

        \Log::info("Scheduling AutoPickJob: pick_time_limit={$league->pick_time_limit}s, pickStartedAt={$pickStartedAt}ms, endTime={$endTime}ms, now={$nowMs}ms, delay={$delayInSeconds}s for pick {$league->current_pick}");

        AutoPickJob::dispatch($league->id, $league->current_pick)
            ->delay(now()->addSeconds($delayInSeconds));

        \Log::info("AutoPickJob dispatched successfully");
    }
}
