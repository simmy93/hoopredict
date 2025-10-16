<?php

use Illuminate\Support\Facades\Broadcast;

/* Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
 */

// Draft channels - only league members can listen
Broadcast::channel('draft.{leagueId}', function ($user, $leagueId) {
    try {
        $league = \App\Models\FantasyLeague::find($leagueId);

        if (!$league) {
            \Log::warning("Draft channel auth failed: League {$leagueId} not found", [
                'user_id' => $user->id,
                'league_id' => $leagueId,
            ]);
            return false;
        }

        $hasAccess = $league->hasUser($user);

        if (!$hasAccess) {
            \Log::warning("Draft channel auth denied: User not in league", [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'league_id' => $leagueId,
                'league_name' => $league->name,
            ]);
        } else {
            \Log::info("Draft channel auth success", [
                'user_id' => $user->id,
                'league_id' => $leagueId,
            ]);
        }

        return $hasAccess;
    } catch (\Exception $e) {
        \Log::error("Draft channel auth error: " . $e->getMessage(), [
            'user_id' => $user->id,
            'league_id' => $leagueId,
            'exception' => $e->getTraceAsString(),
        ]);
        return false;
    }
});
