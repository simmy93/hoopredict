<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FantasyLeague extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'owner_id',
        'championship_id',
        'mode',
        'budget',
        'team_size',
        'invite_code',
        'is_active',
        'is_private',
        'max_members',
        'draft_date',
    ];

    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'is_active' => 'boolean',
            'is_private' => 'boolean',
            'draft_date' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function championship(): BelongsTo
    {
        return $this->belongsTo(Championship::class);
    }

    public function teams(): HasMany
    {
        return $this->hasMany(FantasyTeam::class);
    }

    public function isFull(): bool
    {
        return $this->teams()->count() >= $this->max_members;
    }

    public function hasUser(User $user): bool
    {
        return $this->teams()->where('user_id', $user->id)->exists();
    }

    public function getInviteUrl(): string
    {
        return url("/fantasy-leagues/join/{$this->invite_code}");
    }
}
