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
     * Update player price based on recent performance
     */
    public function updatePriceBasedOnPerformance(): void
    {
        $avgPoints = $this->average_fantasy_points;

        // Price adjustment logic:
        // Excellent (30+ pts): +10%
        // Good (20-29 pts): +5%
        // Average (10-19 pts): no change
        // Poor (5-9 pts): -5%
        // Very Poor (<5 pts): -10%

        $currentPrice = $this->price;
        $newPrice = $currentPrice;

        if ($avgPoints >= 30) {
            $newPrice = $currentPrice * 1.10;
        } elseif ($avgPoints >= 20) {
            $newPrice = $currentPrice * 1.05;
        } elseif ($avgPoints < 5) {
            $newPrice = $currentPrice * 0.90;
        } elseif ($avgPoints < 10) {
            $newPrice = $currentPrice * 0.95;
        }

        // Ensure minimum price
        $newPrice = max($newPrice, 100000);

        $this->update(['price' => $newPrice]);
    }
}
