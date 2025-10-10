<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DraftPick extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'fantasy_league_id',
        'fantasy_team_id',
        'player_id',
        'pick_number',
        'round',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function league(): BelongsTo
    {
        return $this->belongsTo(FantasyLeague::class, 'fantasy_league_id');
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(FantasyTeam::class, 'fantasy_team_id');
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
