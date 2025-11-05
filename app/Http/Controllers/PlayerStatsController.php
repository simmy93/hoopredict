<?php

namespace App\Http\Controllers;

use App\Models\Player;
use App\Models\PlayerGameStat;
use App\Models\PlayerPriceHistory;

class PlayerStatsController extends Controller
{
    /**
     * Get detailed stats for a specific player including game log and price history
     */
    public function show(Player $player)
    {
        // Get player with team relationship
        $player->load('team.championship');

        // Get all game stats for this player, ordered by round
        $gameStats = PlayerGameStat::where('player_id', $player->id)
            ->with(['game' => function ($query) {
                $query->with(['homeTeam', 'awayTeam']);
            }])
            ->whereHas('game', function ($query) {
                $query->where('status', 'finished');
            })
            ->orderBy('id', 'desc') // Most recent first
            ->get()
            ->map(function ($stat) use ($player) {
                $game = $stat->game;

                // Determine opponent
                $isHome = $game->home_team_id === $player->team_id;
                $opponent = $isHome
                    ? ($game->awayTeam->name ?? 'Unknown')
                    : ($game->homeTeam->name ?? 'Unknown');

                // Get price for this round
                $priceHistory = PlayerPriceHistory::where('player_id', $player->id)
                    ->where('round_number', $game->round)
                    ->first();

                return [
                    'round' => $game->round,
                    'game_date' => $game->scheduled_at->toDateString(),
                    'opponent' => $opponent,
                    'minutes' => $stat->minutes_played ?? 0,
                    'points' => $stat->points ?? 0,
                    'rebounds' => $stat->rebounds ?? 0,
                    'assists' => $stat->assists ?? 0,
                    'steals' => $stat->steals ?? 0,
                    'blocks' => $stat->blocks ?? 0,
                    'turnovers' => $stat->turnovers ?? 0,
                    'fantasy_points' => $stat->fantasy_points ?? 0,
                    'price' => $priceHistory?->price,
                ];
            });

        return response()->json([
            'id' => $player->id,
            'name' => $player->name,
            'position' => $player->position,
            'team_name' => $player->team->name,
            'photo_url' => $player->photo_url,
            'price' => $player->price,
            'stats' => $gameStats,
        ]);
    }
}
