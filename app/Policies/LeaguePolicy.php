<?php

namespace App\Policies;

use App\Models\League;
use App\Models\User;

class LeaguePolicy
{
    public function view(User $user, League $league): bool
    {
        return $league->hasUser($user) || ! $league->is_private;
    }

    public function update(User $user, League $league): bool
    {
        $userRole = $league->getUserRole($user);

        return in_array($userRole, ['owner', 'admin']);
    }

    public function delete(User $user, League $league): bool
    {
        return $league->owner_id === $user->id;
    }

    public function leave(User $user, League $league): bool
    {
        return $league->hasUser($user) && $league->owner_id !== $user->id;
    }

    public function manageMembers(User $user, League $league): bool
    {
        $userRole = $league->getUserRole($user);

        return in_array($userRole, ['owner', 'admin']);
    }
}
