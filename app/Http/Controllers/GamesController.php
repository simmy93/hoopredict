<?php

namespace App\Http\Controllers;

use App\Models\Championship;
use App\Models\Game;
use Inertia\Inertia;

class GamesController extends Controller
{
    public function index()
    {
        // Get the active EuroLeague championship
        $championship = Championship::where('is_active', true)->first();

        if (! $championship) {
            return Inertia::render('Games/Index', [
                'games' => [],
                'pagination' => null,
            ]);
        }

        $perPage = 10; // Games per page

        // If no page specified, calculate which page contains upcoming games
        $requestedPage = request('page', null);

        if ($requestedPage === null) {
            // Count games before now to calculate the page with upcoming games
            $gamesBeforeNow = Game::where('championship_id', $championship->id)
                ->where('scheduled_at', '<', now())
                ->count();

            // Calculate page number (add 1 because pages are 1-indexed)
            $requestedPage = floor($gamesBeforeNow / $perPage) + 1;
        }

        // Get paginated games ordered by scheduled date
        $gamesPaginated = Game::where('championship_id', $championship->id)
            ->with(['homeTeam', 'awayTeam'])
            ->orderBy('scheduled_at', 'asc')
            ->paginate($perPage, ['*'], 'page', $requestedPage);

        $games = $gamesPaginated->map(function ($game) {
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

        return Inertia::render('Games/Index', [
            'championship' => [
                'id' => $championship->id,
                'name' => $championship->name,
                'slug' => $championship->slug,
            ],
            'games' => $games,
            'pagination' => [
                'current_page' => $gamesPaginated->currentPage(),
                'last_page' => $gamesPaginated->lastPage(),
                'per_page' => $gamesPaginated->perPage(),
                'total' => $gamesPaginated->total(),
                'from' => $gamesPaginated->firstItem(),
                'to' => $gamesPaginated->lastItem(),
            ],
        ]);
    }
}
