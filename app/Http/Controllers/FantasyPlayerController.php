<?php

namespace App\Http\Controllers;

use App\Models\FantasyLeague;
use App\Models\Player;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FantasyPlayerController extends Controller
{
    public function index(FantasyLeague $league, Request $request)
    {
        $userTeam = $league->teams()->where('user_id', auth()->id())->firstOrFail();

        // Get players with filters
        $query = Player::with('team')
            ->where('is_active', true)
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

        return Inertia::render('Fantasy/Players/Index', [
            'league' => $league,
            'userTeam' => $userTeam,
            'players' => $players,
            'myPlayers' => $myPlayers,
            'filters' => $request->only(['position', 'team_id', 'search', 'sort', 'direction']),
        ]);
    }

    public function buy(FantasyLeague $league, Player $player)
    {
        $userTeam = $league->teams()->where('user_id', auth()->id())->firstOrFail();

        try {
            // Buy the player (all validation is now inside buyPlayer method)
            if ($userTeam->buyPlayer($player)) {
                return back()->with('success', "Successfully purchased {$player->name}!");
            }

            return back()->with('error', 'Failed to purchase player.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function sell(FantasyLeague $league, Player $player)
    {
        $userTeam = $league->teams()->where('user_id', auth()->id())->firstOrFail();

        try {
            // Sell the player (all validation is now inside sellPlayer method)
            if ($userTeam->sellPlayer($player)) {
                return back()->with('success', "Successfully sold {$player->name} for $".number_format($player->price, 0).'!');
            }

            return back()->with('error', 'Failed to sell player.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
