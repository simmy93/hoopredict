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

    public function priceHistories(): HasMany
    {
        return $this->hasMany(PlayerPriceHistory::class);
    }

    /**
     * Calculate average fantasy points from recent games
     * Uses up to last 5 games, falls back to 3, then 1 if fewer games available
     */
    public function getAverageFantasyPointsAttribute(): float
    {
        $gamesCount = $this->gameStats()->count();

        if ($gamesCount === 0) {
            return 0;
        }

        // Determine how many games to use based on availability
        // Prefer 5, fall back to 3, then 1
        $limit = match (true) {
            $gamesCount >= 5 => 5,
            $gamesCount >= 3 => 3,
            default => 1
        };

        return $this->gameStats()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->avg('fantasy_points') ?? 0;
    }

    /**
     * Get the number of games used for calculating average fantasy points
     */
    public function getGamesUsedForPricingAttribute(): int
    {
        $gamesCount = $this->gameStats()->count();

        return match (true) {
            $gamesCount >= 5 => 5,
            $gamesCount >= 3 => 3,
            $gamesCount === 0 => 0,
            default => 1
        };
    }

    /**
     * Update player price based on fantasy points efficiency
     *
     * Simple formula: Average Fantasy Points × 100,000
     *
     * Uses flexible game sample:
     * - Last 5 games if available
     * - Falls back to last 3 games if only 3-4 games played
     * - Falls back to last 1 game if only 1-2 games played
     *
     * Examples:
     * - 30 fantasy pts/game = 3,000,000 (3M)
     * - 20 fantasy pts/game = 2,000,000 (2M)
     * - 10 fantasy pts/game = 1,000,000 (1M)
     * - 5 fantasy pts/game = 500,000 (500k)
     */
    public function updatePriceBasedOnPerformance(): void
    {
        // Get average fantasy points from available games (5, 3, or 1)
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
