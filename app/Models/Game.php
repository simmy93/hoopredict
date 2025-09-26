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
}