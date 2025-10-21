<?php

namespace App\Policies;

use App\Models\Prediction;
use App\Models\User;

class PredictionPolicy
{
    public function view(User $user, Prediction $prediction): bool
    {
        return $user->id === $prediction->user_id ||
               $prediction->league->hasUser($user);
    }

    public function delete(User $user, Prediction $prediction): bool
    {
        return $user->id === $prediction->user_id;
    }

    public function update(User $user, Prediction $prediction): bool
    {
        return $user->id === $prediction->user_id && $prediction->canEdit();
    }
}
