<?php

namespace App\Http\Controllers;

use App\Models\Player;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserPlayerWatchlistController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $watchlistPlayers = $user->watchlist()->with('team')->get();

        return Inertia::render('Watchlist/Index', [
            'watchlistPlayers' => $watchlistPlayers,
        ]);
    }

    public function toggle(Request $request, Player $player)
    {
        $user = Auth::user();
        
        $user->watchlist()->toggle($player->id);

        if ($user->watchlist()->where('player_id', $player->id)->exists()) {
            $message = 'Player added to watchlist.';
        } else {
            $message = 'Player removed from watchlist.';
        }

        return back()->with('success', $message);
    }
}
