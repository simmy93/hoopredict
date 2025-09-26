<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\League;
use App\Models\Prediction;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GameController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        $upcomingGames = Game::with(['homeTeam', 'awayTeam', 'championship'])
            ->where('status', 'scheduled')
            ->where('scheduled_at', '>', now())
            ->orderBy('scheduled_at')
            ->take(10)
            ->get();

        $userLeagues = auth()->user()->leagues()
            ->where('leagues.is_active', true)
            ->get(['leagues.id', 'leagues.name']);

        return Inertia::render('Games/Index', [
            'upcomingGames' => $upcomingGames,
            'userLeagues' => $userLeagues
        ]);
    }

    public function show(Game $game)
    {
        $game->load(['homeTeam', 'awayTeam', 'championship']);

        $userLeagues = auth()->user()->leagues()
            ->where('leagues.is_active', true)
            ->get();

        // Get existing predictions for this user and game across all leagues
        $existingPredictions = Prediction::where('user_id', auth()->id())
            ->where('game_id', $game->id)
            ->get()
            ->keyBy('league_id');

        return Inertia::render('Games/Show', [
            'game' => $game,
            'userLeagues' => $userLeagues,
            'existingPredictions' => $existingPredictions
        ]);
    }
}