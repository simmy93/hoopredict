<?php

namespace App\Http\Controllers;

use App\Models\FantasyLeague;
use App\Models\Game;

class DebugController extends Controller
{
    public function lineupDebug()
    {
        $league = FantasyLeague::first();

        if (!$league) {
            return response()->json(['error' => 'No league found']);
        }

        $round = 12; // Change this to the round you're testing

        // Get the same data the actual controller uses - latest FULLY finished round
        $latestFinishedRound = \App\Models\Game::where('championship_id', $league->championship_id)
            ->select('round')
            ->groupBy('round')
            ->havingRaw('COUNT(*) = SUM(CASE WHEN status = ? THEN 1 ELSE 0 END)', ['finished'])
            ->max('round');

        $currentRound = $latestFinishedRound ? $latestFinishedRound + 1 : 1;

        $locked = Game::isLineupLocked($league->championship_id, $round);
        $nextGame = Game::getNextGameStart($league->championship_id, $round);
        $games = Game::where('championship_id', $league->championship_id)
            ->where('round', $round)
            ->get(['id', 'home_team_code', 'away_team_code', 'status', 'scheduled_at']);

        return response()->json([
            'championship_id' => $league->championship_id,
            'round_being_checked' => $round,
            'latest_finished_round' => $latestFinishedRound,
            'current_round' => $currentRound,
            'is_locked' => $locked,
            'next_game_time' => $nextGame,
            'games' => $games,
            'now' => now()->toIso8601String(),
        ]);
    }
}
