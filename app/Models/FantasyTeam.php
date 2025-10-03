<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class FantasyTeam extends Model
{
    use HasFactory;

    protected $fillable = [
        'fantasy_league_id',
        'user_id',
        'team_name',
        'budget_spent',
        'budget_remaining',
        'total_points',
        'draft_order',
    ];

    protected function casts(): array
    {
        return [
            'budget_spent' => 'decimal:2',
            'budget_remaining' => 'decimal:2',
        ];
    }

    public function fantasyLeague(): BelongsTo
    {
        return $this->belongsTo(FantasyLeague::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fantasyTeamPlayers(): HasMany
    {
        return $this->hasMany(FantasyTeamPlayer::class);
    }

    public function draftPicks(): HasMany
    {
        return $this->hasMany(DraftPick::class);
    }

    public function players(): BelongsToMany
    {
        return $this->belongsToMany(Player::class, 'fantasy_team_players')
            ->withPivot(['purchase_price', 'points_earned', 'acquired_at'])
            ->withTimestamps();
    }

    /**
     * Calculate current team value based on player market prices
     */
    public function getCurrentTeamValue(): float
    {
        return $this->players->sum('price');
    }

    /**
     * Calculate profit/loss (current value - purchase price)
     */
    public function getTeamProfitLoss(): float
    {
        $currentValue = $this->getCurrentTeamValue();
        $purchaseValue = $this->budget_spent;

        return $currentValue - $purchaseValue;
    }

    /**
     * Check if team can afford a player
     */
    public function canAffordPlayer(Player $player): bool
    {
        return $this->budget_remaining >= $player->price;
    }

    /**
     * Check if team has reached max size
     */
    public function isFull(): bool
    {
        return $this->players()->count() >= $this->fantasyLeague->team_size;
    }

    /**
     * Buy a player
     */
    public function buyPlayer(Player $player): bool
    {
        if (!$this->canAffordPlayer($player) || $this->isFull()) {
            return false;
        }

        $this->players()->attach($player->id, [
            'purchase_price' => $player->price,
            'acquired_at' => now(),
        ]);

        $this->update([
            'budget_spent' => $this->budget_spent + $player->price,
            'budget_remaining' => $this->budget_remaining - $player->price,
        ]);

        return true;
    }

    /**
     * Sell a player at current market price
     */
    public function sellPlayer(Player $player): bool
    {
        if (!$this->players()->where('player_id', $player->id)->exists()) {
            return false;
        }

        $this->players()->detach($player->id);

        $this->update([
            'budget_spent' => $this->budget_spent - $player->price,
            'budget_remaining' => $this->budget_remaining + $player->price,
        ]);

        return true;
    }

    /**
     * Draft a player (for draft mode)
     */
    public function draftPlayer(Player $player): bool
    {
        if ($this->isFull()) {
            return false;
        }

        $this->players()->attach($player->id, [
            'purchase_price' => 0,
            'acquired_at' => now(),
        ]);

        return true;
    }
}
