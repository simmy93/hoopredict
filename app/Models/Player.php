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
        'photo_headshot_url',
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
     * Calculate price using weighted average of price history and current round fantasy points
     *
     * Formula: (70% × Average of last 4 price history) + (30% × Current round fantasy points × 100k)
     *
     * - Uses up to 4 previous rounds of price history (70% weight)
     * - Uses current round fantasy points (30% weight)
     * - For first round, uses only fantasy points (no history)
     * - Smooth price transitions prevent wild swings
     *
     * @param  float  $currentRoundFantasyPoints  Fantasy points from the current round (can be negative)
     * @param  int  $currentRoundNumber  Current round number being processed
     * @return float New calculated price (minimum €100k, maximum €10M)
     */
    public function calculateWeightedPrice(float $currentRoundFantasyPoints, int $currentRoundNumber): float
    {
        // Note: This method should only be called if player actually played a game
        // Negative fantasy points are valid and should decrease the price

        // Get price history from previous rounds (up to 4 most recent)
        // Exclude current round and only use rounds with actual prices (not null)
        $priceHistory = $this->priceHistories()
            ->where('round_number', '<', $currentRoundNumber)
            ->whereNotNull('price')
            ->orderBy('round_number', 'desc')
            ->limit(4)
            ->pluck('price');

        // Calculate new game value from current round fantasy points
        $currentGameValue = $currentRoundFantasyPoints * 100000;

        // First round: No history, just use fantasy points directly
        if ($priceHistory->isEmpty()) {
            $newPrice = $currentGameValue;
        } else {
            // Calculate weighted average
            // 70% from historical prices, 30% from current game
            $historicalAverage = $priceHistory->avg();
            $newPrice = ($historicalAverage * 0.70) + ($currentGameValue * 0.30);
        }

        // Apply minimum and maximum bounds
        $newPrice = max($newPrice, 100000);  // Minimum €100k
        $newPrice = min($newPrice, 10000000); // Maximum €10M

        // Round to nearest €10k for cleaner numbers
        return round($newPrice, -4);
    }
}
