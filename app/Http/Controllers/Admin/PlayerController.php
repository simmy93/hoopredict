<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Player;
use App\Models\Team;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlayerController extends Controller
{
    /**
     * Display a listing of players
     */
    public function index(Request $request)
    {
        $query = Player::with('team');

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        // Team filter
        if ($request->has('team_id') && $request->team_id) {
            $query->where('team_id', $request->team_id);
        }

        // Position filter
        if ($request->has('position') && $request->position) {
            $query->where('position', $request->position);
        }

        // Sorting
        $sortBy = $request->get('sort', 'name');
        $direction = $request->get('direction', 'asc');
        $query->orderBy($sortBy, $direction);

        $players = $query->paginate(20)->withQueryString();
        $teams = Team::orderBy('name')->get();

        return Inertia::render('Admin/Players/Index', [
            'players' => $players,
            'teams' => $teams,
            'filters' => $request->only(['search', 'team_id', 'position', 'sort', 'direction']),
        ]);
    }

    /**
     * Update player price
     */
    public function updatePrice(Request $request, Player $player)
    {
        $validated = $request->validate([
            'price' => 'required|numeric|min:100000|max:50000000',
        ]);

        $oldPrice = $player->price;
        $player->price = $validated['price'];

        // Activate player when price is set for the first time
        if ($oldPrice === null && ! $player->is_active) {
            $player->is_active = true;
        }

        $player->save();

        $oldPriceText = $oldPrice ? '$'.($oldPrice / 1000000).'M' : 'not set';

        return redirect()->back()->with('success', sprintf(
            'Player %s price updated from %s to $%.1fM%s',
            $player->name,
            $oldPriceText,
            $player->price / 1000000,
            $oldPrice === null ? ' (player activated)' : ''
        ));
    }

    /**
     * Bulk update prices based on performance
     */
    public function bulkUpdatePrices(Request $request)
    {
        $validated = $request->validate([
            'player_ids' => 'required|array',
            'player_ids.*' => 'exists:players,id',
        ]);

        $updated = 0;
        foreach ($validated['player_ids'] as $playerId) {
            $player = Player::find($playerId);
            if ($player->updatePriceBasedOnPerformance()) {
                $updated++;
            }
        }

        return redirect()->back()->with('success', "Updated prices for {$updated} players based on performance.");
    }

    /**
     * Reset all prices to default
     */
    public function resetPrices(Request $request)
    {
        $validated = $request->validate([
            'player_ids' => 'required|array',
            'player_ids.*' => 'exists:players,id',
            'base_price' => 'required|numeric|min:100000|max:50000000',
        ]);

        $count = Player::whereIn('id', $validated['player_ids'])
            ->update(['price' => $validated['base_price']]);

        return redirect()->back()->with('success', "Reset prices for {$count} players to $".($validated['base_price'] / 1000000).'M');
    }
}
