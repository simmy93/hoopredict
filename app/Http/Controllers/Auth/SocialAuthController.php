<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Redirect to Google OAuth page
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // Find or create user
            $user = User::where('google_id', $googleUser->id)
                ->orWhere('email', $googleUser->email)
                ->first();

            if ($user) {
                // Update google_id if user exists but doesn't have it
                if (! $user->google_id) {
                    $user->google_id = $googleUser->id;
                    $user->avatar = $googleUser->avatar;
                    $user->save();
                }
            } else {
                // Create new user
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar,
                    'password' => Hash::make(Str::random(24)), // Random password for OAuth users
                    'email_verified_at' => now(),
                ]);
            }

            // Log the user in
            Auth::login($user);

            return redirect()->intended(route('how-it-works'));
        } catch (\Exception $e) {
            Log::error('Google OAuth error: '.$e->getMessage());
            Log::error($e->getTraceAsString());

            return redirect('/login')->with('error', 'Failed to authenticate with Google: '.$e->getMessage());
        }
    }
}
