<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FantasyTeamPlayer extends Model
{
    use HasFactory;

    protected $fillable = [
        'fantasy_team_id',
        'player_id',
        'lineup_position',
        'purchase_price',
        'points_earned',
        'acquired_at',
    ];

    protected function casts(): array
    {
        return [
            'purchase_price' => 'decimal:2',
            'acquired_at' => 'datetime',
        ];
    }

    public function fantasyTeam(): BelongsTo
    {
        return $this->belongsTo(FantasyTeam::class);
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    /**
     * Get the scoring multiplier based on lineup position
     *
     * Positions 1-5 (Starters): 100%
     * Position 6 (Sixth Man): 75%
     * Positions 7+ (Bench): 50%
     */
    public function getScoringMultiplier(): float
    {
        if ($this->lineup_position === null) {
            return 0.0; // Not in active lineup
        }

        if ($this->lineup_position <= 5) {
            return 1.0; // 100% for starters
        }

        if ($this->lineup_position === 6) {
            return 0.75; // 75% for sixth man
        }

        return 0.5; // 50% for bench
    }

    /**
     * Check if player is a starter
     */
    public function isStarter(): bool
    {
        return $this->lineup_position !== null && $this->lineup_position <= 5;
    }

    /**
     * Check if player is sixth man
     */
    public function isSixthMan(): bool
    {
        return $this->lineup_position === 6;
    }

    /**
     * Check if player is on bench
     */
    public function isBench(): bool
    {
        return $this->lineup_position !== null && $this->lineup_position >= 7;
    }
}
