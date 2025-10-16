<?php

namespace App\Events;

use App\Models\FantasyLeague;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class DraftCompleted implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(
        public FantasyLeague $league
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("draft.{$this->league->id}");
    }

    public function broadcastWith(): array
    {
        return [
            'league_id' => $this->league->id,
            'draft_status' => 'completed',
            'message' => 'Draft completed!',
        ];
    }
}
