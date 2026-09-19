<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class WebcamSnapshotUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public int $paketId;

    public int|null $attemptId;

    public function __construct(int $paketId, ?int $attemptId = null)
    {
        $this->paketId = $paketId;
        $this->attemptId = $attemptId;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('quiz-monitor.' . $this->paketId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'snapshot.updated';
    }
}