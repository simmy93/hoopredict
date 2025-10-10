<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class CountdownStarted implements ShouldBroadcastNow
{
    use SerializesModels;

    public int $endTime;    // ms
    public int $serverTime; // ms

    public function __construct(int $endTimeMs)
    {
        $this->endTime   = $endTimeMs;
        $this->serverTime = now()->valueOf(); // Carbon -> ms
    }

    // public channel for simplicity; use PrivateChannel or PresenceChannel for protected rooms
    public function broadcastOn(): Channel
    {
        return new Channel('countdown');
    }

    public function broadcastWith(): array
    {
        return [
            'endTime'    => $this->endTime,
            'serverTime' => $this->serverTime,
        ];
    }
}
