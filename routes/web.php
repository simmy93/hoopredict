<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\LeagueController;
use App\Http\Controllers\PredictionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

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
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    Route::resource('leagues', LeagueController::class)->except(['edit', 'update']);
    Route::post('/leagues/join', [LeagueController::class, 'join'])->name('leagues.join');
    Route::get('/leagues/join/{inviteCode}', [LeagueController::class, 'joinByUrl'])->name('leagues.join.url');
    Route::get('/leagues/{league}/users/{user}/predictions', [LeagueController::class, 'userPredictions'])->name('leagues.user.predictions');
    Route::get('/leagues/{league}/games/{game}/predictions', [LeagueController::class, 'gamePredictions'])->name('leagues.game.predictions');
    Route::delete('/leagues/{league}/leave', [LeagueController::class, 'leave'])->name('leagues.leave');
    Route::delete('/leagues/{league}/members/{member}/kick', [LeagueController::class, 'kick'])->name('leagues.members.kick');

    Route::resource('games', GameController::class)->only(['index', 'show']);
    Route::resource('predictions', PredictionController::class)->only(['index', 'store', 'destroy']);

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
