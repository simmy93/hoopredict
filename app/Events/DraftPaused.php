<?php

namespace App\Events;

use App\Models\FantasyLeague;
use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DraftPaused implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public FantasyLeague $fantasyLeague,
        public User $pausedBy,
        public int $timeRemaining
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('draft.' . $this->fantasyLeague->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'draft.paused';
    }

    public function broadcastWith(): array
    {
        return [
            'league_id' => $this->fantasyLeague->id,
            'paused_by' => [
                'id' => $this->pausedBy->id,
                'name' => $this->pausedBy->name,
            ],
            'time_remaining' => $this->timeRemaining,
            'paused_at' => now()->toIso8601String(),
        ];
    }
}
