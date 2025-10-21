<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prediction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'league_id',
        'game_id',
        'home_score_prediction',
        'away_score_prediction',
        'points_earned',
        'scoring_method',
        'predicted_at',
    ];

    protected $casts = [
        'home_score_prediction' => 'integer',
        'away_score_prediction' => 'integer',
        'points_earned' => 'integer',
        'predicted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function league(): BelongsTo
    {
        return $this->belongsTo(League::class);
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function calculatePoints(): int
    {
        if (! $this->game->isFinished()) {
            return 0;
        }

        $actualHome = $this->game->home_score;
        $actualAway = $this->game->away_score;
        $predictedHome = $this->home_score_prediction;
        $predictedAway = $this->away_score_prediction;

        // Exact score match
        if ($actualHome === $predictedHome && $actualAway === $predictedAway) {
            $this->scoring_method = 'exact_score';

            return 30;
        }

        $actualDifference = abs($actualHome - $actualAway);
        $predictedDifference = abs($predictedHome - $predictedAway);
        $actualWinner = $actualHome > $actualAway ? 'home' : ($actualHome < $actualAway ? 'away' : 'draw');
        $predictedWinner = $predictedHome > $predictedAway ? 'home' : ($predictedHome < $predictedAway ? 'away' : 'draw');

        // Check if winner is correct
        if ($actualWinner === $predictedWinner) {
            // Winner + exact point difference
            if ($actualDifference === $predictedDifference) {
                $this->scoring_method = 'exact_difference';

                return 15;
            }

            $pointDifference = abs($actualDifference - $predictedDifference);

            // Winner + within 5 points
            if ($pointDifference <= 5) {
                $this->scoring_method = 'within_5';

                return 10;
            }

            // Winner + within 5-10 points
            if ($pointDifference <= 10) {
                $this->scoring_method = 'within_10';

                return 7;
            }

            // Only winner correct
            $this->scoring_method = 'winner_only';

            return 4;
        }

        $this->scoring_method = null;

        return 0;
    }

    public function canEdit(): bool
    {
        return $this->game->canAcceptPredictions();
    }
}
