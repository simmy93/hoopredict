<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'championship_id',
        'home_team_id',
        'away_team_id',
        'scheduled_at',
        'status',
        'home_score',
        'away_score',
        'round',
        'external_id',
        'code',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'home_score' => 'integer',
        'away_score' => 'integer',
        'round' => 'integer',
    ];

    public function championship(): BelongsTo
    {
        return $this->belongsTo(Championship::class);
    }

    public function homeTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'home_team_id');
    }

    public function awayTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'away_team_id');
    }

    public function predictions(): HasMany
    {
        return $this->hasMany(Prediction::class);
    }

    public function isFinished(): bool
    {
        return $this->status === 'finished';
    }

    public function isScheduled(): bool
    {
        return $this->status === 'scheduled';
    }

    public function canAcceptPredictions(): bool
    {
        return $this->isScheduled() && $this->scheduled_at->isFuture();
    }

    /**
     * Check if a specific round is currently active (started but not finished)
     * A round is active if:
     * 1. The earliest game's scheduled time has been reached, OR
     * 2. At least one game has actually started (has scores or status changed)
     * AND not all games are finished
     */
    public static function isRoundActive(int $championshipId, int $round): bool
    {
        $games = self::where('championship_id', $championshipId)
            ->where('round', $round)
            ->get();

        if ($games->isEmpty()) {
            return false;
        }

        // Check if the earliest game's scheduled time has been reached
        $earliestGameTime = $games->min('scheduled_at');
        $hasReachedGameTime = $earliestGameTime && now()->gte($earliestGameTime);

        // Check if any game has actually started (backup check)
        $hasStartedGames = $games->contains(function ($game) {
            return $game->home_score !== null || $game->status !== 'scheduled';
        });

        // Check if all games are finished
        $allFinished = $games->every(fn($game) => $game->status === 'finished');

        // Round is active if EITHER scheduled time reached OR game actually started
        // AND not all games are finished
        return ($hasReachedGameTime || $hasStartedGames) && !$allFinished;
    }

    /**
     * Get the current active round for a championship (if any)
     */
    public static function getCurrentActiveRound(int $championshipId): ?int
    {
        // Get all rounds and check which one is active
        $rounds = self::where('championship_id', $championshipId)
            ->select('round')
            ->distinct()
            ->orderBy('round')
            ->pluck('round');

        foreach ($rounds as $round) {
            if (self::isRoundActive($championshipId, $round)) {
                return $round;
            }
        }

        return null;
    }
}
