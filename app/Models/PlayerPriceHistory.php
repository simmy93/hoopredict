<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerPriceHistory extends Model
{
    protected $fillable = [
        'player_id',
        'round_number',
        'price',
        'average_fantasy_points',
        'games_used',
        'games_played_in_round',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'average_fantasy_points' => 'decimal:2',
        ];
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
