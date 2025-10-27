<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\LeagueController as AdminLeagueController;
use App\Http\Controllers\Admin\LeagueMemberController as AdminLeagueMemberController;
use App\Http\Controllers\Admin\PlayerController as AdminPlayerController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\DraftController;
use App\Http\Controllers\FantasyLeagueController;
use App\Http\Controllers\FantasyPlayerController;
use App\Http\Controllers\FantasyTeamController;
use App\Http\Controllers\GamesController;
use App\Http\Controllers\LeagueController;
use App\Http\Controllers\PredictionController;
use App\Http\Controllers\StatisticsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::get('/countdown-test', function () {
    return Inertia::render('CountdownTest');
})->name('countdown.test');

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    // Add a test route for shadcn login
    Route::get('login-shadcn', function () {
        return Inertia::render('Auth/LoginShadcn', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    })->name('login.shadcn');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');

    // Google OAuth routes
    Route::get('auth/google', [SocialAuthController::class, 'redirectToGoogle'])->name('auth.google');
    Route::get('auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');
});

Route::middleware('auth')->group(function () {
    Route::get('/statistics', [StatisticsController::class, 'index'])
        ->name('statistics.index');

    Route::get('/how-it-works', function () {
        return Inertia::render('HowItWorks');
    })->name('how-it-works');

    Route::get('/games', [GamesController::class, 'index'])->name('games.index');

    Route::resource('leagues', LeagueController::class)->except(['edit', 'update']);
    Route::post('/leagues/join', [LeagueController::class, 'join'])->name('leagues.join');
    Route::get('/leagues/join/{inviteCode}', [LeagueController::class, 'joinByUrl'])->name('leagues.join.url');
    Route::get('/leagues/{league}/users/{user}/predictions', [LeagueController::class, 'userPredictions'])->name('leagues.user.predictions');
    Route::get('/leagues/{league}/games/{game}/predictions', [LeagueController::class, 'gamePredictions'])->name('leagues.game.predictions');
    Route::delete('/leagues/{league}/leave', [LeagueController::class, 'leave'])->name('leagues.leave');
    Route::delete('/leagues/{league}/members/{member}/kick', [LeagueController::class, 'kick'])->name('leagues.members.kick');

    Route::resource('predictions', PredictionController::class)->only(['index', 'store', 'destroy']);

    // Fantasy Leagues
    Route::prefix('fantasy')->name('fantasy.')->group(function () {
        Route::get('/leagues', [FantasyLeagueController::class, 'index'])->name('leagues.index');
        Route::get('/leagues/create', [FantasyLeagueController::class, 'create'])->name('leagues.create');
        Route::post('/leagues', [FantasyLeagueController::class, 'store'])->name('leagues.store');
        Route::get('/leagues/{league}', [FantasyLeagueController::class, 'show'])->name('leagues.show');
        Route::post('/leagues/join', [FantasyLeagueController::class, 'join'])->name('leagues.join');
        Route::get('/leagues/join/{inviteCode}', [FantasyLeagueController::class, 'joinByUrl'])->name('leagues.join.url');
        Route::delete('/leagues/{league}', [FantasyLeagueController::class, 'destroy'])->name('leagues.destroy');

        // Fantasy Team
        Route::get('/leagues/{league}/team', [FantasyTeamController::class, 'show'])->name('team.show');

        // Fantasy Players (marketplace)
        Route::get('/leagues/{league}/players', [FantasyPlayerController::class, 'index'])->name('players.index');
        Route::post('/leagues/{league}/players/{player}/buy', [FantasyPlayerController::class, 'buy'])->name('players.buy');
        Route::delete('/leagues/{league}/players/{player}/sell', [FantasyPlayerController::class, 'sell'])->name('players.sell');

        // Draft
        Route::get('/leagues/{league}/draft', [DraftController::class, 'show'])->name('draft.show');
        Route::post('/leagues/{league}/draft/start', [DraftController::class, 'start'])->name('draft.start');
        Route::post('/leagues/{league}/draft/pick', [DraftController::class, 'pick'])->name('draft.pick');
        Route::get('/leagues/{league}/draft/available-players', [DraftController::class, 'getAvailablePlayers'])->name('draft.available-players');
        Route::get('/leagues/{league}/draft/status', [DraftController::class, 'status'])->name('draft.status');
        Route::post('/leagues/{league}/draft/pause', [DraftController::class, 'pause'])->name('draft.pause');
        Route::post('/leagues/{league}/draft/resume', [DraftController::class, 'resume'])->name('draft.resume');
        Route::get('/leagues/{league}/draft/history', [DraftController::class, 'history'])->name('draft.history');

        // Lineup Management
        Route::get('/leagues/{league}/lineup', [\App\Http\Controllers\FantasyLineupController::class, 'show'])->name('lineup.show');
        Route::post('/leagues/{league}/lineup', [\App\Http\Controllers\FantasyLineupController::class, 'update'])->name('lineup.update');
        Route::post('/leagues/{league}/lineup/validate', [\App\Http\Controllers\FantasyLineupController::class, 'validate'])->name('lineup.validate');
        Route::post('/leagues/{league}/lineup/auto-generate', [\App\Http\Controllers\FantasyLineupController::class, 'autoGenerate'])->name('lineup.auto-generate');
    });

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::resource('users', AdminUserController::class);
    Route::resource('leagues', AdminLeagueController::class);
    Route::resource('league-members', AdminLeagueMemberController::class);

    // Player management
    Route::get('players', [AdminPlayerController::class, 'index'])->name('players.index');
    Route::patch('players/{player}/price', [AdminPlayerController::class, 'updatePrice'])->name('players.updatePrice');
    Route::post('players/bulk-update', [AdminPlayerController::class, 'bulkUpdatePrices'])->name('players.bulkUpdate');
    Route::post('players/reset-prices', [AdminPlayerController::class, 'resetPrices'])->name('players.resetPrices');
});
