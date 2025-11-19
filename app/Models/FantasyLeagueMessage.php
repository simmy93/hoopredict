<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FantasyLeagueMessage extends Model
{
    protected $fillable = [
        'fantasy_league_id',
        'user_id',
        'message',
        'is_system',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function fantasyLeague(): BelongsTo
    {
        return $this->belongsTo(FantasyLeague::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
