<?php

namespace App\Http\Controllers;

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

        // Get all draft picks
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

        // Check for expired pick and auto-draft
        if ($league->isPickExpired()) {
            $currentTeam = $league->getCurrentDraftTeam();
            if ($currentTeam) {
                $this->autoPick($league, $currentTeam);
                return redirect()->route('fantasy.draft.show', $league);
            }
        }

        // Get current team on the clock
        $currentTeam = $league->getCurrentDraftTeam();
        $timeRemaining = $league->getTimeRemaining();

        return Inertia::render('Fantasy/Draft/Show', [
            'league' => $league->load('owner', 'championship'),
            'userTeam' => $userTeam,
            'teams' => $teams,
            'draftPicks' => $draftPicks,
            'availablePlayers' => $availablePlayers,
            'currentTeam' => $currentTeam,
            'isMyTurn' => $currentTeam && $currentTeam->id === $userTeam->id,
            'timeRemaining' => $timeRemaining,
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

        $league->generateDraftOrder();

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
        $currentTeam = $league->getCurrentDraftTeam();

        if (!$currentTeam || $currentTeam->id !== $userTeam->id) {
            return back()->with('error', 'It is not your turn to pick');
        }

        $player = Player::findOrFail($request->player_id);

        // Check if player already drafted
        if ($league->draftPicks()->where('player_id', $player->id)->exists()) {
            return back()->with('error', 'Player has already been drafted');
        }

        // Check if team is full
        if ($userTeam->isFull()) {
            return back()->with('error', 'Your team is full');
        }

        // Create draft pick
        $totalTeams = $league->teams()->count();
        $currentRound = (int)ceil($league->current_pick / $totalTeams);

        DraftPick::create([
            'fantasy_league_id' => $league->id,
            'fantasy_team_id' => $userTeam->id,
            'player_id' => $player->id,
            'pick_number' => $league->current_pick,
            'round' => $currentRound,
            'created_at' => now(),
        ]);

        // Add player to team
        $userTeam->draftPlayer($player);

        // Increment pick counter and reset timer
        $league->increment('current_pick');
        $league->update(['pick_started_at' => now()]);

        // Check if draft is complete
        if ($league->isDraftComplete()) {
            $league->update(['draft_status' => 'completed']);
            return redirect()->route('fantasy.leagues.show', $league)
                ->with('success', 'Draft completed!');
        }

        return back()->with('success', "You drafted {$player->name}!");
    }

    private function autoPick(FantasyLeague $league, FantasyTeam $team): void
    {
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
            return;
        }

        // Create draft pick
        $totalTeams = $league->teams()->count();
        $currentRound = (int)ceil($league->current_pick / $totalTeams);

        DraftPick::create([
            'fantasy_league_id' => $league->id,
            'fantasy_team_id' => $team->id,
            'player_id' => $player->id,
            'pick_number' => $league->current_pick,
            'round' => $currentRound,
            'created_at' => now(),
        ]);

        // Add player to team
        $team->draftPlayer($player);

        // Increment pick counter and reset timer
        $league->increment('current_pick');
        $league->update(['pick_started_at' => now()]);

        // Check if draft is complete
        if ($league->isDraftComplete()) {
            $league->update(['draft_status' => 'completed']);
        }
    }
}
