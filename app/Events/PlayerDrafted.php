<?php

namespace App\Events;

use App\Models\DraftPick;
use App\Models\FantasyLeague;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class PlayerDrafted implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(
        public FantasyLeague $league,
        public DraftPick $pick
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel("draft.{$this->league->id}");
    }

    public function broadcastWith(): array
    {
        $this->pick->load(['player.team', 'team.user']);

        // Calculate end time for the pick timer
        $pickStartedAt = $this->league->pick_started_at?->valueOf();
        $endTime = $pickStartedAt ? $pickStartedAt + ($this->league->pick_time_limit * 1000) : null;

        return [
            'pick' => [
                'id' => $this->pick->id,
                'pick_number' => $this->pick->pick_number,
                'round' => $this->pick->round,
                'player' => [
                    'id' => $this->pick->player->id,
                    'name' => $this->pick->player->name,
                    'position' => $this->pick->player->position,
                    'price' => $this->pick->player->price,
                    'photo_url' => $this->pick->player->photo_url,
                    'team' => [
                        'id' => $this->pick->player->team->id,
                        'name' => $this->pick->player->team->name,
                    ],
                ],
                'team' => [
                    'id' => $this->pick->team->id,
                    'team_name' => $this->pick->team->team_name,
                    'draft_order' => $this->pick->team->draft_order,
                    'user' => [
                        'id' => $this->pick->team->user->id,
                        'name' => $this->pick->team->user->name,
                    ],
                ],
            ],
            'current_pick' => $this->league->current_pick,
            'draft_status' => $this->league->draft_status,
            'endTime' => $endTime,
            'serverTime' => now()->valueOf(),
        ];
    }
}
