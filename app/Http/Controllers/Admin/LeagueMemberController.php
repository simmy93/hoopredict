<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\League;
use App\Models\LeagueMember;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeagueMemberController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = LeagueMember::with(['league', 'user']);

        if ($request->has('league_id')) {
            $query->where('league_id', $request->league_id);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $members = $query->latest()->paginate(20);
        $leagues = League::select('id', 'name')->get();
        $users = User::select('id', 'name', 'email')->get();

        return Inertia::render('Admin/LeagueMembers/Index', [
            'members' => $members,
            'leagues' => $leagues,
            'users' => $users,
            'filters' => $request->only(['league_id', 'user_id']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $leagues = League::select('id', 'name')->get();
        $users = User::select('id', 'name', 'email')->get();

        return Inertia::render('Admin/LeagueMembers/Create', [
            'leagues' => $leagues,
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'league_id' => 'required|exists:leagues,id',
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:owner,admin,member',
            'joined_at' => 'nullable|date',
        ]);

        // Check if member already exists
        $exists = LeagueMember::where('league_id', $validated['league_id'])
            ->where('user_id', $validated['user_id'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['error' => 'User is already a member of this league.']);
        }

        if (!isset($validated['joined_at'])) {
            $validated['joined_at'] = now();
        }

        LeagueMember::create($validated);

        return redirect()->route('admin.league-members.index')->with('success', 'League member added successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(LeagueMember $leagueMember)
    {
        $leagueMember->load(['league', 'user']);

        return Inertia::render('Admin/LeagueMembers/Show', [
            'member' => $leagueMember,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(LeagueMember $leagueMember)
    {
        $leagueMember->load(['league', 'user']);
        $leagues = League::select('id', 'name')->get();
        $users = User::select('id', 'name', 'email')->get();

        return Inertia::render('Admin/LeagueMembers/Edit', [
            'member' => $leagueMember,
            'leagues' => $leagues,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, LeagueMember $leagueMember)
    {
        $validated = $request->validate([
            'league_id' => 'required|exists:leagues,id',
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:owner,admin,member',
            'joined_at' => 'nullable|date',
        ]);

        // Check if changing to a duplicate membership
        if ($leagueMember->league_id != $validated['league_id'] || $leagueMember->user_id != $validated['user_id']) {
            $exists = LeagueMember::where('league_id', $validated['league_id'])
                ->where('user_id', $validated['user_id'])
                ->where('id', '!=', $leagueMember->id)
                ->exists();

            if ($exists) {
                return back()->withErrors(['error' => 'User is already a member of this league.']);
            }
        }

        $leagueMember->update($validated);

        return redirect()->route('admin.league-members.index')->with('success', 'League member updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(LeagueMember $leagueMember)
    {
        $leagueMember->delete();

        return redirect()->route('admin.league-members.index')->with('success', 'League member removed successfully.');
    }
}