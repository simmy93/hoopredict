<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\League;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeagueController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $leagues = League::with('owner')
            ->withCount(['members', 'predictions'])
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/Leagues/Index', [
            'leagues' => $leagues,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $users = User::select('id', 'name', 'email')->get();

        return Inertia::render('Admin/Leagues/Create', [
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_private' => 'boolean',
            'owner_id' => 'required|exists:users,id',
            'max_members' => 'required|integer|min:2',
            'is_active' => 'boolean',
        ]);

        League::create($validated);

        return redirect()->route('admin.leagues.index')->with('success', 'League created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(League $league)
    {
        $league->load('owner');
        $league->loadCount(['members', 'predictions']);

        return Inertia::render('Admin/Leagues/Show', [
            'league' => $league,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(League $league)
    {
        $users = User::select('id', 'name', 'email')->get();

        return Inertia::render('Admin/Leagues/Edit', [
            'league' => $league,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, League $league)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_private' => 'boolean',
            'owner_id' => 'required|exists:users,id',
            'max_members' => 'required|integer|min:2',
            'is_active' => 'boolean',
        ]);

        $league->update($validated);

        return redirect()->route('admin.leagues.index')->with('success', 'League updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(League $league)
    {
        $league->delete();

        return redirect()->route('admin.leagues.index')->with('success', 'League deleted successfully.');
    }
}
