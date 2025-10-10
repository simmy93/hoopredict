<?php

namespace App\Events;

use App\Models\FantasyLeague;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class DraftStarted implements ShouldBroadcastNow
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
        // Calculate end time for the pick timer
        $pickStartedAt = $this->league->pick_started_at?->valueOf();
        $endTime = $pickStartedAt ? $pickStartedAt + ($this->league->pick_time_limit * 1000) : null;

        return [
            'league_id' => $this->league->id,
            'draft_status' => $this->league->draft_status,
            'current_pick' => $this->league->current_pick,
            'endTime' => $endTime,
            'serverTime' => now()->valueOf(),
            'message' => 'Draft has started!',
        ];
    }
}
