<?php

namespace App\Http\Controllers;

use App\Models\FantasyLeague;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FantasyLineupController extends Controller
{
    /**
     * Show the lineup management page
     */
    public function show(Request $request, FantasyLeague $league)
    {
        $userTeam = $league->teams()->where('user_id', auth()->id())->first();

        if (! $userTeam) {
            return redirect()->route('fantasy.leagues.show', $league)
                ->with('error', 'You are not a member of this league');
        }

        // Get selected round (default to current/next round)
        $selectedRound = $request->input('round');

        // Get the latest FULLY finished round (all games in round must be finished)
        $latestFinishedRound = \App\Models\Game::where('championship_id', $league->championship_id)
            ->select('round')
            ->groupBy('round')
            ->havingRaw('COUNT(*) = SUM(CASE WHEN status = ? THEN 1 ELSE 0 END)', ['finished'])
            ->max('round');

        // Get only past and current rounds (exclude future rounds)
        // Include: finished rounds + current round (latest finished + 1)
        $allRounds = \App\Models\Game::where('championship_id', $league->championship_id)
            ->where('round', '<=', ($latestFinishedRound + 1))
            ->select('round')
            ->distinct()
            ->orderBy('round')
            ->pluck('round');

        // If no round selected, default to the current round (latest finished + 1)
        if (!$selectedRound) {
            $selectedRound = $latestFinishedRound ? $latestFinishedRound + 1 : 1;

            // Make sure the round exists
            if (!$allRounds->contains($selectedRound) && $allRounds->isNotEmpty()) {
                $selectedRound = $latestFinishedRound ?: $allRounds->first();
            }
        }

        // Check if selected round is finished
        $roundGames = \App\Models\Game::where('championship_id', $league->championship_id)
            ->where('round', $selectedRound)
            ->get();

        $isRoundFinished = $roundGames->isNotEmpty() &&
            $roundGames->every(fn($game) => $game->status === 'finished');

        // Check if lineup is locked for this specific round (game about to start or in progress)
        $isRoundLocked = \App\Models\Game::isLineupLocked($league->championship_id, $selectedRound);

        // Get next game time for countdown
        $nextGameTime = \App\Models\Game::getNextGameStart($league->championship_id, $selectedRound);

        // Get team players with their stats for the selected round
        $teamPlayers = $userTeam->fantasyTeamPlayers()
            ->with(['player.team', 'player.gameStats' => function ($query) use ($league, $selectedRound) {
                $query->whereHas('game', function ($q) use ($league, $selectedRound) {
                    $q->where('championship_id', $league->championship_id)
                      ->where('round', $selectedRound);
                });
            }])
            ->orderBy('lineup_position')
            ->get()
            ->map(function ($teamPlayer) use ($isRoundFinished) {
                // Calculate round points for this player
                $roundFantasyPoints = $teamPlayer->player->gameStats->sum('fantasy_points');

                // Apply multiplier if round is finished (uses model's getScoringMultiplier which handles captain logic)
                $multiplier = $teamPlayer->getScoringMultiplier();

                $teamPlayer->round_fantasy_points = $roundFantasyPoints;
                $teamPlayer->round_team_points = $isRoundFinished ? round($roundFantasyPoints * $multiplier, 2) : null;
                $teamPlayer->multiplier = $multiplier;

                return $teamPlayer;
            });

        // Calculate total team points for the round
        $roundTotalPoints = $isRoundFinished ? $teamPlayers->sum('round_team_points') : null;

        // Get position counts for validation feedback
        $positionCounts = $userTeam->getPositionCounts();
        $startingLineupCounts = $userTeam->getStartingLineupPositionCounts();

        return Inertia::render('Fantasy/Lineup/Manage', [
            'league' => $league->load('championship'),
            'userTeam' => $userTeam,
            'teamPlayers' => $teamPlayers,
            'positionCounts' => $positionCounts,
            'startingLineupCounts' => $startingLineupCounts,
            'hasValidTeamComposition' => $userTeam->hasValidTeamComposition(),
            'hasValidStartingLineup' => $userTeam->hasValidStartingLineup(),
            'selectedRound' => (int) $selectedRound,
            'availableRounds' => $allRounds->toArray(),
            'isRoundFinished' => $isRoundFinished,
            'roundTotalPoints' => $roundTotalPoints,
            'isRoundLocked' => $isRoundLocked,
            'nextGameTime' => $nextGameTime,
        ]);
    }

    /**
     * Update the lineup
     */
    public function update(Request $request, FantasyLeague $league)
    {
        $userTeam = $league->teams()->where('user_id', auth()->id())->first();

        if (! $userTeam) {
            return back()->with('error', 'You are not a member of this league');
        }

        // Get the latest FULLY finished round (all games in round are finished)
        $latestFinishedRound = \App\Models\Game::where('championship_id', $league->championship_id)
            ->select('round')
            ->groupBy('round')
            ->havingRaw('COUNT(*) = SUM(CASE WHEN status = ? THEN 1 ELSE 0 END)', ['finished'])
            ->max('round');

        $currentRound = $latestFinishedRound ? $latestFinishedRound + 1 : 1;

        // CRITICAL: Check if lineup changes are locked for current round
        // This prevents saving lineups when games are about to start or in progress
        if (\App\Models\Game::isLineupLocked($league->championship_id, $currentRound)) {
            return back()->with('error', 'Lineup is locked. A game is about to start or is in progress.');
        }

        // ALSO: Prevent saving lineups for past finished rounds
        $roundBeingSaved = $request->input('round', $currentRound);
        if ($roundBeingSaved < $currentRound) {
            return back()->with('error', 'Cannot modify lineups for past rounds.');
        }

        // ALSO: Prevent saving lineups for future rounds that don't exist yet
        $maxAllowedRound = $currentRound;
        if ($roundBeingSaved > $maxAllowedRound) {
            return back()->with('error', 'Cannot save lineups for future rounds.');
        }

        $request->validate([
            'lineup' => 'required|array|min:5|max:6',
            'lineup.*' => 'required|integer|exists:players,id',
            'lineup_type' => 'required|string|in:2-2-1,3-1-1,1-3-1,1-2-2,2-1-2',
            'sixth_man' => 'nullable|integer|exists:players,id',
            'captain_id' => 'nullable|integer|exists:players,id',
        ]);

        $playerIds = $request->input('lineup');
        $sixthManId = $request->input('sixth_man');
        $captainId = $request->input('captain_id');
        $lineupType = $request->input('lineup_type');

        // If sixth man is provided separately, add it to the lineup array
        if ($sixthManId && !in_array($sixthManId, $playerIds)) {
            $playerIds[] = $sixthManId;
        }

        // Validate captain is in the starting lineup (positions 1-5)
        if ($captainId && !in_array($captainId, array_slice($playerIds, 0, 5))) {
            return back()->with('error', 'Captain must be in the starting lineup (not sixth man or bench)');
        }

        // Validate all players belong to the team
        foreach ($playerIds as $playerId) {
            if (! $userTeam->players()->where('player_id', $playerId)->exists()) {
                return back()->with('error', 'One or more players do not belong to your team');
            }
        }

        // Validate captain belongs to the team if provided
        if ($captainId && !$userTeam->players()->where('player_id', $captainId)->exists()) {
            return back()->with('error', 'Captain does not belong to your team');
        }

        // Validate position changes for players who have already played
        $playedPlayerIds = \App\Models\PlayerGameStat::whereHas('game', function($q) use ($league, $currentRound) {
            $q->where('championship_id', $league->championship_id)
              ->where('round', $currentRound)
              ->where('status', '!=', 'not_started'); // Started or finished
        })->pluck('player_id')->toArray();

        // Get current lineup positions before update
        $currentLineup = $userTeam->fantasyTeamPlayers()->get()->keyBy('player_id');

        // Check each player being moved
        foreach ($playerIds as $index => $playerId) {
            if (!in_array($playerId, $playedPlayerIds)) {
                continue; // Player hasn't played, can move anywhere
            }

            $newPosition = $index + 1; // Convert array index to position (1-6)
            $currentPlayer = $currentLineup->get($playerId);
            $oldPosition = $currentPlayer?->lineup_position;
            $wasCaptain = $currentPlayer?->is_captain ?? false;
            $isNewCaptain = $captainId === $playerId;

            // Check if moving UP in value (not allowed after playing)
            if ($this->isMovingUp($oldPosition, $newPosition, $wasCaptain, $isNewCaptain)) {
                $playerName = \App\Models\Player::find($playerId)->name;
                return back()->with('error', "Cannot move {$playerName} to a more valuable position after they've already played.");
            }
        }

        try {
            // Save lineup type
            $userTeam->update(['lineup_type' => $lineupType]);

            // Reset all lineup positions and captain status first
            $userTeam->fantasyTeamPlayers()->update([
                'lineup_position' => null,
                'is_captain' => false,
            ]);

            // Assign new positions (1-5 for starters, 6 for sixth man)
            foreach ($playerIds as $index => $playerId) {
                $userTeam->fantasyTeamPlayers()
                    ->where('player_id', $playerId)
                    ->update(['lineup_position' => $index + 1]);
            }

            // Set captain if provided
            if ($captainId) {
                $userTeam->fantasyTeamPlayers()
                    ->where('player_id', $captainId)
                    ->update(['is_captain' => true]);
            }

            return back()->with('success', 'Lineup updated successfully!');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Validate a proposed lineup without saving
     */
    public function validate(Request $request, FantasyLeague $league)
    {
        $userTeam = $league->teams()->where('user_id', auth()->id())->first();

        if (! $userTeam) {
            return response()->json(['error' => 'Not a member of this league'], 403);
        }

        $request->validate([
            'lineup' => 'required|array|size:5',
            'lineup.*' => 'required|integer|exists:players,id',
        ]);

        $playerIds = $request->input('lineup');

        // Get players with their positions
        $players = \App\Models\Player::whereIn('id', $playerIds)->get();

        // Count positions
        $counts = [
            'Guard' => $players->where('position', 'Guard')->count(),
            'Forward' => $players->where('position', 'Forward')->count(),
            'Center' => $players->where('position', 'Center')->count(),
        ];

        // Validate
        $errors = [];

        if ($counts['Guard'] < 1) {
            $errors[] = 'Need at least 1 Guard';
        }
        if ($counts['Forward'] < 1) {
            $errors[] = 'Need at least 1 Forward';
        }
        if ($counts['Center'] < 1) {
            $errors[] = 'Need at least 1 Center';
        }

        if ($counts['Guard'] > 3) {
            $errors[] = 'Maximum 3 Guards allowed';
        }
        if ($counts['Forward'] > 3) {
            $errors[] = 'Maximum 3 Forwards allowed';
        }
        if ($counts['Center'] > 2) {
            $errors[] = 'Maximum 2 Centers allowed';
        }

        return response()->json([
            'valid' => empty($errors),
            'errors' => $errors,
            'counts' => $counts,
        ]);
    }

    /**
     * Auto-generate a valid lineup based on player performance
     */
    public function autoGenerate(FantasyLeague $league)
    {
        $userTeam = $league->teams()->where('user_id', auth()->id())->first();

        if (! $userTeam) {
            return back()->with('error', 'You are not a member of this league');
        }

        // Get all team players sorted by fantasy points
        $players = $userTeam->players()
            ->with('gameStats')
            ->get()
            ->sortByDesc(function ($player) {
                return $player->average_fantasy_points;
            });

        // Separate by position
        $guards = $players->where('position', 'Guard')->values();
        $forwards = $players->where('position', 'Forward')->values();
        $centers = $players->where('position', 'Center')->values();

        // Build lineup: Try to get best balanced lineup
        // Start with 2G, 2F, 1C as default
        $lineup = [];

        // Add top 2 guards
        if ($guards->count() >= 2) {
            $lineup[] = $guards[0]->id;
            $lineup[] = $guards[1]->id;
        } else {
            return back()->with('error', 'Not enough guards to create a valid lineup');
        }

        // Add top 2 forwards
        if ($forwards->count() >= 2) {
            $lineup[] = $forwards[0]->id;
            $lineup[] = $forwards[1]->id;
        } else {
            return back()->with('error', 'Not enough forwards to create a valid lineup');
        }

        // Add top center
        if ($centers->count() >= 1) {
            $lineup[] = $centers[0]->id;
        } else {
            return back()->with('error', 'Not enough centers to create a valid lineup');
        }

        // Add remaining 5 best players (6th man + bench)
        $remaining = $players->reject(function ($player) use ($lineup) {
            return in_array($player->id, $lineup);
        })->take(5)->pluck('id')->toArray();

        $lineup = array_merge($lineup, $remaining);

        try {
            $userTeam->setLineup($lineup);

            return back()->with('success', 'Auto-generated lineup set successfully!');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Check if a position change represents moving UP in value
     * Captain (4) > Starter (3) > Sixth Man (2) > Bench (1)
     */
    private function isMovingUp(?int $oldPosition, int $newPosition, bool $wasCaptain, bool $isNewCaptain): bool
    {
        $oldValue = $this->getPositionValue($oldPosition, $wasCaptain);
        $newValue = $this->getPositionValue($newPosition, $isNewCaptain);

        return $newValue > $oldValue;
    }

    /**
     * Get numeric value for a position
     * Captain (4) > Starter (3) > Sixth Man (2) > Bench (1)
     */
    private function getPositionValue(?int $position, bool $isCaptain): int
    {
        if ($isCaptain) return 4; // Captain
        if ($position >= 1 && $position <= 5) return 3; // Starter
        if ($position === 6) return 2; // Sixth man
        return 1; // Bench (null or > 6)
    }
}
