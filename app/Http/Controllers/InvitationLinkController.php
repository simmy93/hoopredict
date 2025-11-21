<?php

namespace App\Http\Controllers;

use App\Models\FantasyLeague;
use App\Models\FantasyTeam;
use App\Models\InvitationLink;
use App\Models\League;
use App\Models\LeagueMember;
use Illuminate\Http\Request;

class InvitationLinkController extends Controller
{
    /**
     * Create a new invitation link for a league (prediction or fantasy)
     */
    public function store(Request $request)
    {
        $request->validate([
            'invitable_type' => 'required|in:league,fantasy_league',
            'invitable_id' => 'required|integer',
            'max_uses' => 'nullable|integer|min:1|max:100',
            'expires_in' => 'nullable|in:1h,6h,24h,7d,30d,never',
        ]);

        // Get the league
        $league = $request->invitable_type === 'league'
            ? League::findOrFail($request->invitable_id)
            : FantasyLeague::findOrFail($request->invitable_id);

        // Only owner can create invitation links
        if ($league->owner_id !== auth()->id()) {
            abort(403, 'Only the league owner can create invitation links.');
        }

        // Calculate expiration time
        $expiresAt = match ($request->expires_in) {
            '1h' => now()->addHour(),
            '6h' => now()->addHours(6),
            '24h' => now()->addDay(),
            '7d' => now()->addWeek(),
            '30d' => now()->addMonth(),
            default => null, // never expires
        };

        $invitationLink = InvitationLink::create([
            'invitable_type' => $request->invitable_type === 'league'
                ? League::class
                : FantasyLeague::class,
            'invitable_id' => $league->id,
            'created_by' => auth()->id(),
            'max_uses' => $request->max_uses,
            'expires_at' => $expiresAt,
        ]);

        return back()->with('success', 'Invitation link created successfully!');
    }

    /**
     * List all invitation links for a league
     */
    public function index(Request $request)
    {
        $request->validate([
            'invitable_type' => 'required|in:league,fantasy_league',
            'invitable_id' => 'required|integer',
        ]);

        $league = $request->invitable_type === 'league'
            ? League::findOrFail($request->invitable_id)
            : FantasyLeague::findOrFail($request->invitable_id);

        if ($league->owner_id !== auth()->id()) {
            abort(403, 'Only the league owner can view invitation links.');
        }

        $links = $league->invitationLinks()
            ->with('creator:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($link) use ($request) {
                $prefix = $request->invitable_type === 'league' ? '/leagues' : '/fantasy/leagues';
                return [
                    'id' => $link->id,
                    'code' => $link->code,
                    'url' => url("{$prefix}/invite/{$link->code}"),
                    'max_uses' => $link->max_uses,
                    'uses' => $link->uses,
                    'remaining_uses' => $link->remaining_uses,
                    'expires_at' => $link->expires_at?->toIso8601String(),
                    'is_active' => $link->is_active,
                    'status' => $link->status,
                    'created_at' => $link->created_at->toIso8601String(),
                    'creator' => $link->creator,
                ];
            });

        return response()->json(['links' => $links]);
    }

    /**
     * Deactivate an invitation link
     */
    public function destroy(InvitationLink $link)
    {
        $league = $link->invitable;

        if ($league->owner_id !== auth()->id()) {
            abort(403, 'Only the league owner can deactivate invitation links.');
        }

        $link->update(['is_active' => false]);

        return back()->with('success', 'Invitation link deactivated.');
    }

    /**
     * Join via invitation link code (prediction league)
     */
    public function joinLeague(string $code)
    {
        $link = InvitationLink::where('code', $code)
            ->where('invitable_type', League::class)
            ->first();

        if (!$link || !$link->isValid()) {
            return redirect()->route('leagues.index')
                ->withErrors(['error' => 'Invalid or expired invite link.']);
        }

        $league = $link->invitable;

        if (!$league || !$league->is_active) {
            return redirect()->route('leagues.index')
                ->withErrors(['error' => 'This league is no longer active.']);
        }

        if ($league->isFull()) {
            return redirect()->route('leagues.index')
                ->withErrors(['error' => 'This league is full.']);
        }

        if ($league->hasUser(auth()->user())) {
            return redirect()->route('leagues.show', $league)
                ->with('info', 'You are already a member of this league.');
        }

        LeagueMember::create([
            'league_id' => $league->id,
            'user_id' => auth()->id(),
            'role' => 'member',
            'joined_at' => now(),
        ]);

        // Increment uses
        $link->incrementUses();

        return redirect()->route('leagues.show', $league)
            ->with('success', "Welcome to {$league->name}!");
    }

    /**
     * Join via invitation link code (fantasy league)
     */
    public function joinFantasyLeague(string $code)
    {
        $link = InvitationLink::where('code', $code)
            ->where('invitable_type', FantasyLeague::class)
            ->first();

        if (!$link || !$link->isValid()) {
            return redirect()->route('fantasy.leagues.index')
                ->withErrors(['error' => 'Invalid or expired invite link.']);
        }

        $league = $link->invitable;

        if (!$league || !$league->is_active) {
            return redirect()->route('fantasy.leagues.index')
                ->withErrors(['error' => 'This league is no longer active.']);
        }

        if ($league->isFull()) {
            return redirect()->route('fantasy.leagues.index')
                ->withErrors(['error' => 'This league is full.']);
        }

        if ($league->hasUser(auth()->user())) {
            return redirect()->route('fantasy.leagues.show', $league)
                ->with('info', 'You are already a member of this league.');
        }

        // Create team for the user
        FantasyTeam::create([
            'fantasy_league_id' => $league->id,
            'user_id' => auth()->id(),
            'team_name' => auth()->user()->name . "'s Team",
            'budget_spent' => 0,
            'budget_remaining' => $league->budget,
            'total_points' => 0,
        ]);

        // Increment uses
        $link->incrementUses();

        return redirect()->route('fantasy.leagues.show', $league)
            ->with('success', "Welcome to {$league->name}!");
    }
}
