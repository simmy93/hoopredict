<?php

namespace App\Http\Controllers;

use App\Events\DraftCompleted;
use App\Events\DraftStarted;
use App\Events\PlayerDrafted;
use App\Jobs\AutoPickJob;
use App\Models\DraftAction;
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

        if (! $userTeam) {
            return redirect()->route('fantasy.leagues.show', $league)
                ->with('error', 'You are not a member of this league');
        }

        // Get all teams ordered by draft order
        $teams = $league->teams()
            ->with('user:id,name')
            ->orderBy('draft_order')
            ->get();

        // Check for expired pick and auto-draft BEFORE loading other data
        // But only if draft is not paused
        if (! $league->is_paused && $league->isPickExpired()) {
            $currentTeam = $league->getCurrentDraftTeam();
            if ($currentTeam) {
                $this->performAutoPick($league, $currentTeam);
                // Reload the league to get updated current_pick
                $league->refresh();
            }
        }

        // Get all draft picks (after potential auto-pick)
        $draftPicks = $league->draftPicks()
            ->with(['team.user:id,name', 'player'])
            ->orderBy('pick_number')
            ->get();

        // Get available players count (but don't load all players - use lazy loading instead)
        $draftedPlayerIds = $draftPicks->pluck('player_id')->toArray();

        $availablePlayersCount = Player::where('is_active', true)
            ->whereNotIn('id', $draftedPlayerIds)
            ->whereHas('team', function ($q) use ($league) {
                $q->where('championship_id', $league->championship_id);
            })
            ->count();

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
            'league' => $league->load('owner', 'championship', 'pausedBy'),
            'userTeam' => $userTeam,
            'teams' => $teams,
            'draftPicks' => $draftPicks,
            'availablePlayersCount' => $availablePlayersCount,
            'draftedPlayerIds' => $draftedPlayerIds,
            'currentTeam' => $currentTeam,
            'isMyTurn' => $currentTeam && $currentTeam->id === $userTeam->id,
            'endTime' => $endTime,
            'serverTime' => $serverTime,
            'canPauseResume' => $league->canUserPauseResume(request()->user()),
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

        // Log draft start
        DraftAction::log(
            fantasyLeagueId: $league->id,
            actionType: 'start',
            userId: auth()->id()
        );

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

        if ($league->is_paused) {
            return back()->with('error', 'Draft is currently paused');
        }

        $userTeam = $league->teams()->where('user_id', auth()->id())->first();

        if (! $userTeam) {
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

                if (! $currentTeam || $currentTeam->id !== $userTeam->id) {
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

                // Validate team composition - minimum: 3 Guards, 3 Forwards, 2 Centers
                $currentPlayers = $userTeam->players()->get();
                $positionCounts = [
                    'Guard' => $currentPlayers->where('position', 'Guard')->count(),
                    'Forward' => $currentPlayers->where('position', 'Forward')->count(),
                    'Center' => $currentPlayers->where('position', 'Center')->count(),
                ];

                // Count after adding this player
                $positionCounts[$player->position]++;

                // Check if this would violate composition rules
                $totalPicks = $currentPlayers->count() + 1;
                $remainingPicks = $league->team_size - $totalPicks;

                // Calculate maximum allowed for this position
                // Max Guards = team_size - min_forwards - min_centers = 10 - 3 - 2 = 5
                // Max Forwards = team_size - min_guards - min_centers = 10 - 3 - 2 = 5
                // Max Centers = team_size - min_guards - min_forwards = 10 - 3 - 3 = 4
                $maxAllowed = [
                    'Guard' => $league->team_size - 3 - 2, // 5
                    'Forward' => $league->team_size - 3 - 2, // 5
                    'Center' => $league->team_size - 3 - 3, // 4
                ];

                if ($positionCounts[$player->position] > $maxAllowed[$player->position]) {
                    $minRequired = [
                        'Guard' => 3,
                        'Forward' => 3,
                        'Center' => 2,
                    ];
                    throw new \Exception("Cannot draft another {$player->position}. Team composition requires minimum: {$minRequired['Guard']} Guards, {$minRequired['Forward']} Forwards, {$minRequired['Center']} Centers. You already have {$positionCounts[$player->position]} {$player->position}s.");
                }

                // Store current pick number before incrementing
                $currentPickNumber = $league->current_pick;
                $totalTeams = $league->teams()->count();
                $currentRound = (int) ceil($currentPickNumber / $totalTeams);

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
                    'pick_started_at' => now(),
                ]);

                // Log draft pick
                DraftAction::log(
                    fantasyLeagueId: $league->id,
                    actionType: 'pick',
                    fantasyTeamId: $userTeam->id,
                    playerId: $player->id,
                    userId: auth()->id(),
                    pickNumber: $currentPickNumber,
                    roundNumber: $currentRound
                );

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
            \Log::error('Draft pick failed: '.$e->getMessage());

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
                    \Log::info('Auto-pick aborted: draft not in progress');

                    return null;
                }

                // Verify draft is not paused
                if ($league->is_paused) {
                    \Log::info('Auto-pick aborted: draft is paused');

                    return null;
                }

                // Get available players
                $draftedPlayerIds = $league->draftPicks()->pluck('player_id')->toArray();

                $player = Player::where('is_active', true)
                    ->whereNotIn('id', $draftedPlayerIds)
                    ->whereHas('team', function ($q) use ($league) {
                        $q->where('championship_id', $league->championship_id);
                    })
                    ->orderBy('price', 'desc')
                    ->first();

                if (! $player) {
                    \Log::warning('No available players for auto-pick');

                    return null;
                }

                // Store current pick number before incrementing
                $currentPickNumber = $league->current_pick;
                $totalTeams = $league->teams()->count();
                $currentRound = (int) ceil($currentPickNumber / $totalTeams);

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
                    'pick_started_at' => now(),
                ]);

                return $pick;
            });

            if (! $pick) {
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
            \Log::error('Auto-pick failed: '.$e->getMessage());
        }
    }

    private function scheduleAutoPickJob(FantasyLeague $league): void
    {
        \Log::info("scheduleAutoPickJob called for league {$league->id}, pick {$league->current_pick}");

        if (! $league->pick_started_at || $league->draft_status !== 'in_progress') {
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

        \Log::info('AutoPickJob dispatched successfully');
    }

    public function pause(FantasyLeague $league)
    {
        $user = request()->user();

        if (! $league->canUserPauseResume($user)) {
            return back()->with('error', 'Only the league owner can pause the draft');
        }

        if ($league->draft_status !== 'in_progress') {
            return back()->with('error', 'Draft is not in progress');
        }

        if ($league->is_paused) {
            return back()->with('error', 'Draft is already paused');
        }

        if ($league->pauseDraft($user)) {
            return back()->with('success', 'Draft has been paused');
        }

        return back()->with('error', 'Failed to pause draft');
    }

    public function resume(FantasyLeague $league)
    {
        $user = request()->user();

        if (! $league->canUserPauseResume($user)) {
            return back()->with('error', 'Only the league owner can resume the draft');
        }

        if ($league->draft_status !== 'in_progress') {
            return back()->with('error', 'Draft is not in progress');
        }

        if (! $league->is_paused) {
            return back()->with('error', 'Draft is not paused');
        }

        if ($league->resumeDraft($user)) {
            // Schedule auto-pick job for resumed draft
            $this->scheduleAutoPickJob($league);

            return back()->with('success', 'Draft has been resumed');
        }

        return back()->with('error', 'Failed to resume draft');
    }

    public function getAvailablePlayers(FantasyLeague $league, Request $request)
    {
        $request->validate([
            'search' => 'nullable|string|max:255',
            'position' => 'nullable|string|in:Guard,Forward,Center',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:10|max:50',
        ]);

        $userTeam = $league->teams()->where('user_id', auth()->id())->first();

        if (! $userTeam) {
            return response()->json(['error' => 'You are not a member of this league'], 403);
        }

        // Get drafted player IDs
        $draftedPlayerIds = $league->draftPicks()->pluck('player_id')->toArray();

        // Build query
        $query = Player::with('team')
            ->where('is_active', true)
            ->whereNotIn('id', $draftedPlayerIds)
            ->whereHas('team', function ($q) use ($league) {
                $q->where('championship_id', $league->championship_id);
            });

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        // Apply position filter
        if ($request->filled('position')) {
            $query->where('position', $request->position);
        }

        // Order by price (best players first)
        $query->orderBy('price', 'desc');

        // Paginate
        $perPage = $request->input('per_page', 20);
        $players = $query->paginate($perPage);

        return response()->json($players);
    }

    public function history(FantasyLeague $league)
    {
        $userTeam = $league->teams()->where('user_id', auth()->id())->first();

        if (! $userTeam) {
            return redirect()->route('fantasy.leagues.show', $league)
                ->with('error', 'You are not a member of this league');
        }

        $draftActions = $league->draftActions()
            ->with(['user:id,name', 'fantasyTeam.user:id,name', 'player'])
            ->orderBy('action_at', 'desc')
            ->get()
            ->map(function ($action) {
                return [
                    'id' => $action->id,
                    'action_type' => $action->action_type,
                    'action_at' => $action->action_at->toIso8601String(),
                    'user' => $action->user ? [
                        'id' => $action->user->id,
                        'name' => $action->user->name,
                    ] : null,
                    'team' => $action->fantasyTeam ? [
                        'id' => $action->fantasyTeam->id,
                        'name' => $action->fantasyTeam->name,
                        'user' => $action->fantasyTeam->user ? [
                            'id' => $action->fantasyTeam->user->id,
                            'name' => $action->fantasyTeam->user->name,
                        ] : null,
                    ] : null,
                    'player' => $action->player ? [
                        'id' => $action->player->id,
                        'name' => $action->player->name,
                        'position' => $action->player->position,
                    ] : null,
                    'pick_number' => $action->pick_number,
                    'round_number' => $action->round_number,
                    'details' => $action->details,
                ];
            });

        return Inertia::render('Fantasy/Draft/History', [
            'league' => $league->load('owner', 'championship'),
            'userTeam' => $userTeam,
            'draftActions' => $draftActions,
        ]);
    }
}
