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

        // Get the latest finished round to determine current round
        $latestFinishedRound = \App\Models\Game::where('championship_id', $league->championship_id)
            ->where('status', 'finished')
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

        // Check if current round is active (started but not finished) - blocks changes
        $currentActiveRound = \App\Models\Game::getCurrentActiveRound($league->championship_id);
        $isRoundLocked = $currentActiveRound !== null;

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

                // Apply multiplier if round is finished
                $multiplier = 0.5; // Bench default
                if ($teamPlayer->lineup_position) {
                    if ($teamPlayer->lineup_position >= 1 && $teamPlayer->lineup_position <= 5) {
                        $multiplier = 1.0; // Starter
                    } elseif ($teamPlayer->lineup_position === 6) {
                        $multiplier = 0.75; // Sixth man
                    }
                }

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
            'currentActiveRound' => $currentActiveRound,
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

        // Check if round is locked (active round in progress)
        $currentActiveRound = \App\Models\Game::getCurrentActiveRound($league->championship_id);
        if ($currentActiveRound !== null) {
            return back()->with('error', "Cannot change lineup while Round {$currentActiveRound} is in progress. Please wait until the round finishes.");
        }

        $request->validate([
            'lineup' => 'required|array|min:5|max:6',
            'lineup.*' => 'required|integer|exists:players,id',
            'lineup_type' => 'required|string|in:2-2-1,3-1-1,1-3-1,1-2-2,2-1-2',
            'sixth_man' => 'nullable|integer|exists:players,id',
        ]);

        $playerIds = $request->input('lineup');
        $sixthManId = $request->input('sixth_man');
        $lineupType = $request->input('lineup_type');

        // If sixth man is provided separately, add it to the lineup array
        if ($sixthManId && !in_array($sixthManId, $playerIds)) {
            $playerIds[] = $sixthManId;
        }

        // Validate all players belong to the team
        foreach ($playerIds as $playerId) {
            if (! $userTeam->players()->where('player_id', $playerId)->exists()) {
                return back()->with('error', 'One or more players do not belong to your team');
            }
        }

        try {
            // Save lineup type
            $userTeam->update(['lineup_type' => $lineupType]);

            // Reset all lineup positions first
            $userTeam->fantasyTeamPlayers()->update(['lineup_position' => null]);

            // Assign new positions (1-5 for starters, 6 for sixth man)
            foreach ($playerIds as $index => $playerId) {
                $userTeam->fantasyTeamPlayers()
                    ->where('player_id', $playerId)
                    ->update(['lineup_position' => $index + 1]);
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
}
