<?php

namespace App\Http\Controllers;

use App\Models\Game;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        // Get upcoming games (next 6 games from now, regardless of date range)
        $upcomingGames = Game::with(['homeTeam', 'awayTeam', 'championship'])
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at', 'asc')
            ->limit(6)
            ->get()
            ->map(function ($game) {
                return [
                    'id' => $game->id,
                    'date' => $game->scheduled_at ? $game->scheduled_at->format('Y-m-d H:i:s') : null,
                    'status' => $game->status,
                    'home_score' => $game->home_score,
                    'away_score' => $game->away_score,
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

        return Inertia::render('Dashboard', [
            'user' => request()->user(),
            'upcomingGames' => $upcomingGames,
        ]);
    }
}
