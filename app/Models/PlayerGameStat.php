<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerGameStat extends Model
{
    use HasFactory;

    protected $fillable = [
        'player_id',
        'game_id',
        'minutes_played',
        'points',
        'rebounds',
        'assists',
        'steals',
        'blocks',
        'turnovers',
        'fantasy_points',
    ];

    protected function casts(): array
    {
        return [
            'fantasy_points' => 'decimal:2',
        ];
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * Calculate fantasy points based on stats
     * Points: 1 point
     * Rebounds: 1.2 points
     * Assists: 1.5 points
     * Steals: 3 points
     * Blocks: 3 points
     * Turnovers: -1 point
     */
    public function calculateFantasyPoints(): float
    {
        $fantasyPoints = 0;

        $fantasyPoints += $this->points * 1;
        $fantasyPoints += $this->rebounds * 1.2;
        $fantasyPoints += $this->assists * 1.5;
        $fantasyPoints += $this->steals * 3;
        $fantasyPoints += $this->blocks * 3;
        $fantasyPoints += $this->turnovers * -1;

        // Bonus for double-double (10+ in 2 categories)
        $doubleCategories = 0;
        if ($this->points >= 10) $doubleCategories++;
        if ($this->rebounds >= 10) $doubleCategories++;
        if ($this->assists >= 10) $doubleCategories++;

        if ($doubleCategories >= 2) {
            $fantasyPoints += 5; // Double-double bonus
        }

        if ($doubleCategories >= 3) {
            $fantasyPoints += 10; // Triple-double bonus (additional)
        }

        return round($fantasyPoints, 2);
    }

    /**
     * Auto-calculate and save fantasy points
     */
    public function updateFantasyPoints(): void
    {
        $this->update([
            'fantasy_points' => $this->calculateFantasyPoints()
        ]);
    }
}
