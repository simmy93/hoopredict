<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoundProcessingStatus extends Model
{
    protected $table = 'round_processing_status';

    protected $fillable = [
        'championship_id',
        'round_number',
        'processed_at',
        'total_games',
        'finished_games',
        'players_updated',
    ];

    protected function casts(): array
    {
        return [
            'processed_at' => 'datetime',
        ];
    }

    public function championship(): BelongsTo
    {
        return $this->belongsTo(Championship::class);
    }
}
