<?php

namespace App\Http\Controllers;

use App\Models\Championship;
use App\Models\FantasyLeague;
use App\Models\FantasyTeam;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FantasyLeagueController extends Controller
{
    /**
     * Generate a secure invite code
     * 8 alphanumeric characters = 62^8 = 218 trillion combinations
     */
    private function generateSecureInviteCode(): string
    {
        do {
            // Use alphanumeric (A-Z, 0-9) for better security
            $code = strtoupper(substr(str_replace(['/', '+', '='], '', base64_encode(random_bytes(6))), 0, 8));
        } while (FantasyLeague::where('invite_code', $code)->exists());

        return $code;
    }

    public function index()
    {
        $userLeagues = auth()->user()
            ->fantasyTeams()
            ->with(['fantasyLeague.owner', 'fantasyLeague.championship'])
            ->get()
            ->map(fn ($team) => $team->fantasyLeague)
            ->unique('id')
            ->values()
            ->map(function ($league) {
                $league->teams_count = $league->teams()->count();
                return $league;
            });

        return Inertia::render('Fantasy/Index', [
            'userLeagues' => $userLeagues,
        ]);
    }

    public function create()
    {
        $championships = Championship::where('is_active', true)->get();

        return Inertia::render('Fantasy/Create', [
            'championships' => $championships,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'championship_id' => 'required|exists:championships,id',
            'mode' => 'required|in:budget,draft',
            'budget' => 'required|numeric|in:10000000,17500000,25000000', // Budget Genius, Balanced Baller, Rich Dad Mode
            'team_size' => 'required|integer|min:8|max:15', // Min 8 to satisfy composition rules (3G, 3F, 2C)
            'is_private' => 'boolean',
            'max_members' => 'required|integer|min:2|max:50',
            'draft_date' => 'nullable|date|after:now',
        ]);

        $league = FantasyLeague::create([
            'name' => $request->name,
            'description' => $request->description,
            'owner_id' => auth()->id(),
            'championship_id' => $request->championship_id,
            'mode' => $request->mode,
            'budget' => $request->budget,
            'team_size' => $request->team_size,
            'invite_code' => $this->generateSecureInviteCode(),
            'is_private' => $request->boolean('is_private', false),
            'max_members' => $request->max_members,
            'draft_date' => $request->draft_date,
        ]);

        // Automatically create a team for the owner
        FantasyTeam::create([
            'fantasy_league_id' => $league->id,
            'user_id' => auth()->id(),
            'team_name' => auth()->user()->name."'s Team",
            'budget_spent' => 0,
            'budget_remaining' => $league->budget,
            'total_points' => 0,
        ]);

        return redirect()->route('fantasy.leagues.show', $league)
            ->with('success', 'Fantasy league created successfully!');
    }

    public function show(FantasyLeague $league)
    {
        // Check if user is a member of the league
        if (! $league->hasUser(auth()->user())) {
            return redirect()->route('fantasy.leagues.index')
                ->with('error', 'You are not a member of this league.');
        }

        $league->load([
            'owner',
            'championship',
            'teams.user',
            'teams.players',
        ]);

        $userTeam = $league->teams()->with('user')->where('user_id', auth()->id())->first();

        // Get leaderboard
        $leaderboard = $league->teams()
            ->with('user')
            ->orderBy('total_points', 'desc')
            ->get();

        return Inertia::render('Fantasy/Show', [
            'league' => $league,
            'userTeam' => $userTeam,
            'leaderboard' => $leaderboard,
            'inviteUrl' => $league->getInviteUrl(),
        ]);
    }

    public function join(Request $request)
    {
        $request->validate([
            'invite_code' => 'required|string|min:6|max:8',
        ]);

        $league = FantasyLeague::where('invite_code', strtoupper($request->invite_code))
            ->where('is_active', true)
            ->first();

        if (! $league) {
            return back()->withErrors(['invite_code' => 'Invalid invite code.']);
        }

        if ($league->isFull()) {
            return back()->withErrors(['invite_code' => 'This league is full.']);
        }

        if ($league->hasUser(auth()->user())) {
            return back()->withErrors(['invite_code' => 'You are already a member of this league.']);
        }

        // Create team for the user
        FantasyTeam::create([
            'fantasy_league_id' => $league->id,
            'user_id' => auth()->id(),
            'team_name' => auth()->user()->name."'s Team",
            'budget_spent' => 0,
            'budget_remaining' => $league->budget,
            'total_points' => 0,
        ]);

        return redirect()->route('fantasy.leagues.show', $league)
            ->with('success', 'Successfully joined the league!');
    }

    public function joinByUrl(string $inviteCode)
    {
        $league = FantasyLeague::where('invite_code', strtoupper($inviteCode))
            ->where('is_active', true)
            ->first();

        if (! $league) {
            return redirect()->route('fantasy.leagues.index')
                ->withErrors(['error' => 'Invalid or expired invite link.']);
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
            'team_name' => auth()->user()->name."'s Team",
            'budget_spent' => 0,
            'budget_remaining' => $league->budget,
            'total_points' => 0,
        ]);

        return redirect()->route('fantasy.leagues.show', $league)
            ->with('success', "🎉 Welcome to {$league->name}!");
    }

    public function leave(FantasyLeague $league)
    {
        $user = auth()->user();

        // Check if user is the owner
        if ($league->owner_id === $user->id) {
            return back()->withErrors(['error' => 'League owners cannot leave. Please delete the league instead or transfer ownership first.']);
        }

        // Find and delete user's fantasy team
        $team = $league->teams()->where('user_id', $user->id)->first();

        if (!$team) {
            return back()->withErrors(['error' => 'You are not a member of this league.']);
        }

        // Delete the fantasy team (this will cascade delete fantasy_team_players)
        $team->delete();

        return redirect()->route('fantasy.leagues.index')
            ->with('success', "You have left {$league->name}.");
    }

    public function destroy(FantasyLeague $league)
    {
        if ($league->owner_id !== auth()->id()) {
            abort(403, 'Only the league owner can delete this league.');
        }

        $league->delete();

        return redirect()->route('fantasy.leagues.index')
            ->with('success', 'League deleted successfully.');
    }
}
