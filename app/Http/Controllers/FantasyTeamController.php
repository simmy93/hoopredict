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

        // Get user's current players IDs
        $myPlayerIds = $userTeam->players()->pluck('player_id')->toArray();

        // Get players with filters (exclude already owned players)
        $query = Player::with('team')
            ->where('is_active', true)
            ->whereNotIn('id', $myPlayerIds)
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

        return Inertia::render('Fantasy/Team/Show', [
            'league' => $league,
            'userTeam' => $userTeam,
            'players' => $players,
            'myPlayers' => $myPlayers,
            'filters' => $request->only(['position', 'team_id', 'search', 'sort', 'direction']),
        ]);
    }
}
