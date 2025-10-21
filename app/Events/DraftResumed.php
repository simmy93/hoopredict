<?php

namespace App\Events;

use App\Models\FantasyLeague;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DraftResumed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public FantasyLeague $fantasyLeague,
        public User $resumedBy
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('draft.'.$this->fantasyLeague->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'draft.resumed';
    }

    public function broadcastWith(): array
    {
        $currentTeam = $this->fantasyLeague->getCurrentDraftTeam();

        return [
            'league_id' => $this->fantasyLeague->id,
            'resumed_by' => [
                'id' => $this->resumedBy->id,
                'name' => $this->resumedBy->name,
            ],
            'pick_started_at' => $this->fantasyLeague->pick_started_at?->toIso8601String(),
            'current_team_id' => $currentTeam?->id,
            'resumed_at' => now()->toIso8601String(),
        ];
    }
}
