<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DraftAction extends Model
{
    protected $fillable = [
        'fantasy_league_id',
        'fantasy_team_id',
        'player_id',
        'user_id',
        'action_type',
        'pick_number',
        'round_number',
        'details',
        'action_at',
    ];

    protected $casts = [
        'action_at' => 'datetime',
        'details' => 'array',
    ];

    public function fantasyLeague(): BelongsTo
    {
        return $this->belongsTo(FantasyLeague::class);
    }

    public function fantasyTeam(): BelongsTo
    {
        return $this->belongsTo(FantasyTeam::class);
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log a draft action
     */
    public static function log(
        int $fantasyLeagueId,
        string $actionType,
        ?int $fantasyTeamId = null,
        ?int $playerId = null,
        ?int $userId = null,
        ?int $pickNumber = null,
        ?int $roundNumber = null,
        ?array $details = null
    ): self {
        return self::create([
            'fantasy_league_id' => $fantasyLeagueId,
            'fantasy_team_id' => $fantasyTeamId,
            'player_id' => $playerId,
            'user_id' => $userId,
            'action_type' => $actionType,
            'pick_number' => $pickNumber,
            'round_number' => $roundNumber,
            'details' => $details,
            'action_at' => now(),
        ]);
    }
}
