<?php

namespace App\Http\Controllers;

use App\Models\FantasyLeague;
use App\Models\FantasyTeam;
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
            ->whereHas('team', function($q) use ($league) {
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
            $query->where('name', 'like', '%' . $request->search . '%');
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

        // Check if already owns this player
        if ($userTeam->players()->where('player_id', $player->id)->exists()) {
            return back()->withErrors(['error' => 'You already own this player.']);
        }

        // Check if team is full
        if ($userTeam->isFull()) {
            return back()->withErrors(['error' => "Your team is full. Maximum {$league->team_size} players allowed."]);
        }

        // Check if can afford
        if (!$userTeam->canAffordPlayer($player)) {
            return back()->withErrors(['error' => 'Insufficient budget to buy this player.']);
        }

        // Buy the player
        if ($userTeam->buyPlayer($player)) {
            return back()->with('success', "Successfully purchased {$player->name}!");
        }

        return back()->withErrors(['error' => 'Failed to purchase player.']);
    }

    public function sell(FantasyLeague $league, Player $player)
    {
        $userTeam = $league->teams()->where('user_id', auth()->id())->firstOrFail();

        // Check if owns this player
        if (!$userTeam->players()->where('player_id', $player->id)->exists()) {
            return back()->withErrors(['error' => 'You do not own this player.']);
        }

        // Sell the player
        if ($userTeam->sellPlayer($player)) {
            return back()->with('success', "Successfully sold {$player->name} for $" . number_format($player->price, 0) . "!");
        }

        return back()->withErrors(['error' => 'Failed to sell player.']);
    }
}
