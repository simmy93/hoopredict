<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

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
     * Check if buying a player would violate team composition rules
     * Returns error message if invalid, null if valid
     */
    public function canBuyPlayer(Player $player): ?string
    {
        // Check if already owns this player
        if ($this->players()->where('player_id', $player->id)->exists()) {
            return 'You already own this player.';
        }

        // Check if team is full
        if ($this->isFull()) {
            return "Your team is full. Maximum {$this->fantasyLeague->team_size} players allowed.";
        }

        // Check if can afford
        if (! $this->canAffordPlayer($player)) {
            return 'Insufficient budget to buy this player.';
        }

        // Get current position counts
        $counts = $this->getPositionCounts();
        $currentTotal = array_sum($counts);

        // Calculate remaining slots after this purchase
        $remainingSlots = $this->fantasyLeague->team_size - $currentTotal - 1;

        // Check if buying this player would prevent meeting minimum requirements
        if ($player->position === 'Guard') {
            // After buying this guard, check if we can still fill minimums for other positions
            $otherSlotsNeeded = max(0, 3 - $counts['Forward']) + max(0, 2 - $counts['Center']);
            if ($otherSlotsNeeded > $remainingSlots) {
                return 'Cannot buy this Guard. You need to ensure you can still acquire at least 3 Forwards and 2 Centers.';
            }
        }

        if ($player->position === 'Forward') {
            // After buying this forward, check if we can still fill minimums for other positions
            $otherSlotsNeeded = max(0, 3 - $counts['Guard']) + max(0, 2 - $counts['Center']);
            if ($otherSlotsNeeded > $remainingSlots) {
                return 'Cannot buy this Forward. You need to ensure you can still acquire at least 3 Guards and 2 Centers.';
            }
        }

        if ($player->position === 'Center') {
            // After buying this center, check if we can still fill minimums for other positions
            $otherSlotsNeeded = max(0, 3 - $counts['Guard']) + max(0, 3 - $counts['Forward']);
            if ($otherSlotsNeeded > $remainingSlots) {
                return 'Cannot buy this Center. You need to ensure you can still acquire at least 3 Guards and 3 Forwards.';
            }
        }

        return null; // Can buy
    }

    /**
     * Buy a player
     */
    public function buyPlayer(Player $player): bool
    {
        return DB::transaction(function () use ($player) {
            // Lock the team row to prevent concurrent budget changes
            $team = self::where('id', $this->id)
                ->lockForUpdate()
                ->first();

            // Check all buying rules including position requirements
            $validationError = $team->canBuyPlayer($player);
            if ($validationError) {
                throw new \Exception($validationError);
            }

            $team->players()->attach($player->id, [
                'purchase_price' => $player->price,
                'acquired_at' => now(),
            ]);

            $team->update([
                'budget_spent' => $team->budget_spent + $player->price,
                'budget_remaining' => $team->budget_remaining - $player->price,
            ]);

            // Update the current instance
            $this->refresh();

            return true;
        });
    }

    /**
     * Check if selling a player would violate team composition rules
     * Returns error message if invalid, null if valid
     */
    public function canSellPlayer(Player $player): ?string
    {
        // Check if owns this player
        if (! $this->players()->where('player_id', $player->id)->exists()) {
            return 'You do not own this player.';
        }

        // Get current position counts
        $counts = $this->getPositionCounts();

        // Check if selling this player would drop below minimums
        if ($player->position === 'Guard' && $counts['Guard'] <= 3) {
            return 'Cannot sell this Guard. You must maintain at least 3 Guards on your team.';
        }

        if ($player->position === 'Forward' && $counts['Forward'] <= 3) {
            return 'Cannot sell this Forward. You must maintain at least 3 Forwards on your team.';
        }

        if ($player->position === 'Center' && $counts['Center'] <= 2) {
            return 'Cannot sell this Center. You must maintain at least 2 Centers on your team.';
        }

        return null; // Can sell
    }

    /**
     * Sell a player at current market price
     */
    public function sellPlayer(Player $player): bool
    {
        return DB::transaction(function () use ($player) {
            // Lock the team row to prevent concurrent budget changes
            $team = self::where('id', $this->id)
                ->lockForUpdate()
                ->first();

            if (! $team->players()->where('player_id', $player->id)->exists()) {
                return false;
            }

            // Check position requirements
            $validationError = $team->canSellPlayer($player);
            if ($validationError) {
                throw new \Exception($validationError);
            }

            $team->players()->detach($player->id);

            $team->update([
                'budget_spent' => $team->budget_spent - $player->price,
                'budget_remaining' => $team->budget_remaining + $player->price,
            ]);

            // Update the current instance
            $this->refresh();

            return true;
        });
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

    /**
     * Get position counts for the team
     */
    public function getPositionCounts(): array
    {
        $players = $this->players()->with('team')->get();

        return [
            'Guard' => $players->where('position', 'Guard')->count(),
            'Forward' => $players->where('position', 'Forward')->count(),
            'Center' => $players->where('position', 'Center')->count(),
        ];
    }

    /**
     * Validate team composition meets minimum requirements
     * Minimum: 3 Guards, 3 Forwards, 2 Centers
     */
    public function hasValidTeamComposition(): bool
    {
        $counts = $this->getPositionCounts();

        return $counts['Guard'] >= 3
            && $counts['Forward'] >= 3
            && $counts['Center'] >= 2;
    }

    /**
     * Get position counts for starting lineup
     */
    public function getStartingLineupPositionCounts(): array
    {
        $starters = $this->fantasyTeamPlayers()
            ->with('player')
            ->where('lineup_position', '>=', 1)
            ->where('lineup_position', '<=', 5)
            ->get();

        return [
            'Guard' => $starters->filter(fn ($ftp) => $ftp->player->position === 'Guard')->count(),
            'Forward' => $starters->filter(fn ($ftp) => $ftp->player->position === 'Forward')->count(),
            'Center' => $starters->filter(fn ($ftp) => $ftp->player->position === 'Center')->count(),
        ];
    }

    /**
     * Validate starting lineup composition
     * Valid combinations (5 players total):
     * - At least 1 of each position (Guard, Forward, Center)
     * - Guards: max 3
     * - Forwards: max 3
     * - Centers: max 2
     */
    public function hasValidStartingLineup(): bool
    {
        $counts = $this->getStartingLineupPositionCounts();
        $total = array_sum($counts);

        // Must have exactly 5 starters
        if ($total !== 5) {
            return false;
        }

        // Must have at least 1 of each position
        if ($counts['Guard'] < 1 || $counts['Forward'] < 1 || $counts['Center'] < 1) {
            return false;
        }

        // Position-specific limits
        if ($counts['Guard'] > 3) {
            return false;
        }

        if ($counts['Forward'] > 3) {
            return false;
        }

        // Centers max 2 (not 3 like other positions)
        if ($counts['Center'] > 2) {
            return false;
        }

        return true;
    }

    /**
     * Calculate team's total fantasy points with position multipliers
     * Starters (1-5): 100%, Sixth Man (6): 75%, Bench (7+): 50%
     */
    public function calculateTotalPoints(): float
    {
        $teamPlayers = $this->fantasyTeamPlayers()->with('player.gameStats')->get();
        $totalPoints = 0;

        foreach ($teamPlayers as $teamPlayer) {
            $multiplier = $teamPlayer->getScoringMultiplier();

            // Get player's average fantasy points from last 5 games
            $avgFantasyPoints = $teamPlayer->player->average_fantasy_points;

            // Apply multiplier
            $totalPoints += $avgFantasyPoints * $multiplier;
        }

        return round($totalPoints, 2);
    }

    /**
     * Set lineup positions for players
     * Automatically assigns positions 1-10 based on array order
     */
    public function setLineup(array $playerIds): bool
    {
        return DB::transaction(function () use ($playerIds) {
            // Validate we have exactly team_size players
            if (count($playerIds) !== $this->fantasyLeague->team_size) {
                return false;
            }

            // Reset all lineup positions
            $this->fantasyTeamPlayers()->update(['lineup_position' => null]);

            // Assign new positions
            foreach ($playerIds as $position => $playerId) {
                $this->fantasyTeamPlayers()
                    ->where('player_id', $playerId)
                    ->update(['lineup_position' => $position + 1]); // 1-based index
            }

            // Validate the lineup
            if (! $this->hasValidStartingLineup()) {
                throw new \Exception('Invalid starting lineup composition');
            }

            return true;
        });
    }
}
