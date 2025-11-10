<?php

namespace App\Http\Controllers;

use App\Models\FantasyLeague;
use App\Models\Player;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FantasyTeamController extends Controller
{
    public function show(FantasyLeague $league, Request $request)
    {
        $userTeam = $league->teams()->where('user_id', auth()->id())->firstOrFail();

        // ============ MARKETPLACE DATA ============
        // Get user's current players IDs
        $myPlayerIds = $userTeam->players()->pluck('player_id')->toArray();

        // Get players with filters (exclude already owned players)
        $query = Player::with('team')
            ->where('is_active', true)
            ->whereNotIn('id', $myPlayerIds)
            ->whereHas('team', function ($q) use ($league) {
                $q->where('championship_id', $league->championship_id);
            });

        // Filter by position
        if ($request->has('position') && $request->position !== 'all') {
            $query->where('position', $request->position);
        }

        // Filter by team
        if ($request->has('team_id')) {
            $query->where('team_id', $request->team_id);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        // Sort
        $sortBy = $request->get('sort', 'price');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortBy, $sortDirection);

        $players = $query->paginate(20);

        // Get user's current players
        $myPlayers = $userTeam->players()->with('team')->get();

        // ============ LINEUP DATA ============
        // Get selected round (default to current/next round)
        $selectedRound = $request->input('round');

        // Get the latest finished round to determine current round
        $latestFinishedRound = \App\Models\Game::where('championship_id', $league->championship_id)
            ->where('status', 'finished')
            ->max('round');

        // Get only past and current rounds (exclude future rounds)
        $allRounds = \App\Models\Game::where('championship_id', $league->championship_id)
            ->where('round', '<=', ($latestFinishedRound + 1))
            ->select('round')
            ->distinct()
            ->orderBy('round')
            ->pluck('round');

        // If no round selected, default to the current round
        if (!$selectedRound) {
            $selectedRound = $latestFinishedRound ? $latestFinishedRound + 1 : 1;

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

        // Check if current round is active (locked)
        $currentActiveRound = \App\Models\Game::getCurrentActiveRound($league->championship_id);
        $isRoundLocked = $currentActiveRound !== null;

        // Get team players with their lineup positions
        // For finished rounds, load from history; otherwise load current lineup
        if ($isRoundFinished) {
            // Load historical lineup snapshot for finished round
            $historicalLineup = \App\Models\FantasyTeamLineupHistory::where('fantasy_team_id', $userTeam->id)
                ->where('round', $selectedRound)
                ->get()
                ->keyBy('fantasy_team_player_id');

            $teamPlayers = $userTeam->fantasyTeamPlayers()
                ->with(['player.team', 'player.gameStats' => function ($query) use ($league, $selectedRound) {
                    $query->whereHas('game', function ($q) use ($league, $selectedRound) {
                        $q->where('championship_id', $league->championship_id)
                          ->where('round', $selectedRound);
                    });
                }])
                ->get()
                ->map(function ($teamPlayer) use ($historicalLineup, $isRoundFinished) {
                    // Use historical lineup position and captain status if available
                    $history = $historicalLineup->get($teamPlayer->id);
                    if ($history) {
                        $teamPlayer->lineup_position = $history->lineup_position;
                        $teamPlayer->is_captain = $history->is_captain;
                    }

                    $roundFantasyPoints = $teamPlayer->player->gameStats->sum('fantasy_points');

                    // Calculate multiplier based on historical position
                    $multiplier = 0.5; // Bench default
                    if ($teamPlayer->is_captain) {
                        $multiplier = 2.0; // Captain
                    } elseif ($teamPlayer->lineup_position) {
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
                })
                ->sortBy('lineup_position')
                ->values();
        } else {
            // Load current lineup for active/future rounds
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
                    $roundFantasyPoints = $teamPlayer->player->gameStats->sum('fantasy_points');

                    // Calculate multiplier
                    $multiplier = 0.5; // Bench default
                    if ($teamPlayer->is_captain) {
                        $multiplier = 2.0; // Captain
                    } elseif ($teamPlayer->lineup_position) {
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
        }

        $roundTotalPoints = $isRoundFinished ? $teamPlayers->sum('round_team_points') : null;

        // Get position counts for validation
        $positionCounts = $userTeam->getPositionCounts();
        $startingLineupCounts = $userTeam->getStartingLineupPositionCounts();

        return Inertia::render('Fantasy/Team/Show', [
            'league' => $league->load('championship'),
            'userTeam' => $userTeam,
            // Marketplace data
            'players' => $players,
            'myPlayers' => $myPlayers,
            'filters' => $request->only(['position', 'team_id', 'search', 'sort', 'direction']),
            // Lineup data
            'teamPlayers' => $teamPlayers,
            'allRounds' => $allRounds->toArray(),
            'selectedRound' => (int) $selectedRound,
            'isRoundFinished' => $isRoundFinished,
            'isRoundLocked' => $isRoundLocked,
            'roundTotalPoints' => $roundTotalPoints,
            'currentActiveRound' => $currentActiveRound,
            'positionCounts' => $positionCounts,
            'startingLineupCounts' => $startingLineupCounts,
            'hasValidTeamComposition' => $userTeam->hasValidTeamComposition(),
            'hasValidStartingLineup' => $userTeam->hasValidStartingLineup(),
        ]);
    }
}
