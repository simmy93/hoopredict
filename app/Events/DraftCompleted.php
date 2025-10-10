<?php

namespace App\Events;

use App\Models\FantasyLeague;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class DraftCompleted implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(
        public FantasyLeague $league
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel("draft.{$this->league->id}");
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
