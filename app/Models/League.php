<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Str;

class League extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_private',
        'invite_code',
        'owner_id',
        'max_members',
        'is_active',
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'is_active' => 'boolean',
        'max_members' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($league) {
            if (!$league->invite_code) {
                $league->invite_code = Str::upper(Str::random(6));
            }
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(LeagueMember::class);
    }

    public function users(): HasManyThrough
    {
        return $this->hasManyThrough(User::class, LeagueMember::class, 'league_id', 'id', 'id', 'user_id');
    }

    public function predictions(): HasMany
    {
        return $this->hasMany(Prediction::class);
    }

    public function leaderboards(): HasMany
    {
        return $this->hasMany(LeagueLeaderboard::class);
    }

    public function isFull(): bool
    {
        return $this->members()->count() >= $this->max_members;
    }

    public function hasUser(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    public function getUserRole(User $user): ?string
    {
        $member = $this->members()->where('user_id', $user->id)->first();
        return $member?->role;
    }

    public function getInviteUrl(): string
    {
        return url("/leagues/join/{$this->invite_code}");
    }
}