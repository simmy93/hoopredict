<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    use HasFactory;

    protected $fillable = [
        'external_id',
        'name',
        'position',
        'jersey_number',
        'team_id',
        'photo_url',
        'country',
        'price',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function gameStats(): HasMany
    {
        return $this->hasMany(PlayerGameStat::class);
    }

    public function fantasyTeamPlayers(): HasMany
    {
        return $this->hasMany(FantasyTeamPlayer::class);
    }

    /**
     * Calculate average fantasy points from recent games
     */
    public function getAverageFantasyPointsAttribute(): float
    {
        return $this->gameStats()
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->avg('fantasy_points') ?? 0;
    }

    /**
     * Update player price based on fantasy points efficiency
     *
     * Simple formula: Average Fantasy Points × 100,000
     *
     * Examples:
     * - 30 fantasy pts/game = 3,000,000 (3M)
     * - 20 fantasy pts/game = 2,000,000 (2M)
     * - 10 fantasy pts/game = 1,000,000 (1M)
     * - 5 fantasy pts/game = 500,000 (500k)
     */
    public function updatePriceBasedOnPerformance(): void
    {
        // Get average fantasy points from last 5 games
        $avgFantasyPoints = $this->average_fantasy_points;

        // If no games played yet, keep current price
        if ($avgFantasyPoints <= 0) {
            return;
        }

        // Straightforward: fantasy points × 100k
        $newPrice = $avgFantasyPoints * 100000;

        // Set minimum and maximum bounds
        $newPrice = max($newPrice, 100000);  // Minimum 100k (very poor performers)
        $newPrice = min($newPrice, 10000000); // Maximum 10M (superstars)

        $this->update(['price' => round($newPrice, -4)]); // Round to nearest 10k
    }
}
