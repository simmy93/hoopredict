<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FantasyTeamLineupHistory extends Model
{
    protected $table = 'fantasy_team_lineup_history';

    protected $fillable = [
        'fantasy_team_id',
        'round',
        'fantasy_team_player_id',
        'lineup_position',
        'is_captain',
    ];

    protected $casts = [
        'is_captain' => 'boolean',
    ];

    /**
     * Get the fantasy team this lineup history belongs to.
     */
    public function fantasyTeam(): BelongsTo
    {
        return $this->belongsTo(FantasyTeam::class);
    }

    /**
     * Get the fantasy team player this history entry is for.
     */
    public function fantasyTeamPlayer(): BelongsTo
    {
        return $this->belongsTo(FantasyTeamPlayer::class);
    }
}
