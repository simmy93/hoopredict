<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeagueLeaderboard extends Model
{
    use HasFactory;

    protected $fillable = [
        'league_id',
        'user_id',
        'total_points',
        'total_predictions',
        'correct_predictions',
        'exact_score_predictions',
        'exact_difference_predictions',
        'within_5_predictions',
        'within_10_predictions',
        'winner_only_predictions',
        'accuracy_percentage',
    ];

    protected $casts = [
        'total_points' => 'integer',
        'total_predictions' => 'integer',
        'correct_predictions' => 'integer',
        'exact_score_predictions' => 'integer',
        'exact_difference_predictions' => 'integer',
        'within_5_predictions' => 'integer',
        'within_10_predictions' => 'integer',
        'winner_only_predictions' => 'integer',
        'accuracy_percentage' => 'decimal:2',
    ];

    public function league(): BelongsTo
    {
        return $this->belongsTo(League::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function updateStats(): void
    {
        $predictions = Prediction::where('user_id', $this->user_id)
            ->where('league_id', $this->league_id)
            ->whereNotNull('points_earned')
            ->get();

        $this->total_predictions = $predictions->count();
        $this->total_points = $predictions->sum('points_earned');
        $this->correct_predictions = $predictions->where('points_earned', '>', 0)->count();
        $this->exact_score_predictions = $predictions->where('scoring_method', 'exact_score')->count();
        $this->exact_difference_predictions = $predictions->where('scoring_method', 'exact_difference')->count();
        $this->within_5_predictions = $predictions->where('scoring_method', 'within_5')->count();
        $this->within_10_predictions = $predictions->where('scoring_method', 'within_10')->count();
        $this->winner_only_predictions = $predictions->where('scoring_method', 'winner_only')->count();

        $this->accuracy_percentage = $this->total_predictions > 0
            ? ($this->correct_predictions / $this->total_predictions) * 100
            : 0;

        $this->save();
    }
}