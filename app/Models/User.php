<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function ownedLeagues(): HasMany
    {
        return $this->hasMany(League::class, 'owner_id');
    }

    public function leagueMembers(): HasMany
    {
        return $this->hasMany(LeagueMember::class);
    }

    public function leagues()
    {
        return $this->belongsToMany(League::class, 'league_members')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    public function predictions(): HasMany
    {
        return $this->hasMany(Prediction::class);
    }

    public function leaderboards(): HasMany
    {
        return $this->hasMany(LeagueLeaderboard::class);
    }
}
