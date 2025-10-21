<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FantasyLeague;
use App\Models\League;
use App\Models\LeagueMember;
use App\Models\Player;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_users' => User::count(),
            'total_admins' => User::where('is_admin', true)->count(),
            'total_leagues' => League::count(),
            'active_leagues' => League::where('is_active', true)->count(),
            'total_members' => LeagueMember::count(),
            'total_players' => Player::count(),
            'active_players' => Player::where('is_active', true)->count(),
            'total_fantasy_leagues' => FantasyLeague::count(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
        ]);
    }
}
