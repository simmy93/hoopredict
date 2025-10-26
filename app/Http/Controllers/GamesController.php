<?php

namespace App\Http\Controllers;

use App\Models\Championship;
use App\Models\Game;
use Inertia\Inertia;

class GamesController extends Controller
{
    public function index()
    {
        // Get all championships
        $championships = Championship::all();

        $gamesData = [];

        foreach ($championships as $championship) {
            // Get all games for this championship, ordered by scheduled date
            $games = Game::where('championship_id', $championship->id)
                ->with(['homeTeam', 'awayTeam'])
                ->orderBy('scheduled_at', 'desc')
                ->get()
                ->map(function ($game) {
                    return [
                        'id' => $game->id,
                        'scheduled_at' => $game->scheduled_at?->toIso8601String(),
                        'status' => $game->status,
                        'home_score' => $game->home_score,
                        'away_score' => $game->away_score,
                        'round' => $game->round,
                        'home_team' => [
                            'id' => $game->homeTeam->id,
                            'name' => $game->homeTeam->name,
                            'logo_url' => $game->homeTeam->logo_url,
                        ],
                        'away_team' => [
                            'id' => $game->awayTeam->id,
                            'name' => $game->awayTeam->name,
                            'logo_url' => $game->awayTeam->logo_url,
                        ],
                    ];
                });

            $gamesData[$championship->slug] = [
                'championship' => [
                    'id' => $championship->id,
                    'name' => $championship->name,
                    'slug' => $championship->slug,
                ],
                'games' => $games,
            ];
        }

        return Inertia::render('Games/Index', [
            'games' => $gamesData,
        ]);
    }
}
