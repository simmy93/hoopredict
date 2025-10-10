<?php

namespace App\Jobs;

use App\Http\Controllers\DraftController;
use App\Models\FantasyLeague;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AutoPickJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $leagueId,
        public int $expectedPick
    ) {}

    public function handle(): void
    {
        \Log::info("AutoPickJob started for league {$this->leagueId}, expected pick {$this->expectedPick}");

        $league = FantasyLeague::find($this->leagueId);

        if (!$league) {
            \Log::warning("League not found: {$this->leagueId}");
            return;
        }

        \Log::info("League found. Current pick: {$league->current_pick}, Draft status: {$league->draft_status}, pick_time_limit: {$league->pick_time_limit}");
        \Log::info("Pick started at: {$league->pick_started_at}");

        // Only auto-pick if we're still on the expected pick number
        // (prevents auto-picking if someone already picked manually)
        if ($league->current_pick !== $this->expectedPick) {
            \Log::info("Pick number changed. Expected: {$this->expectedPick}, Current: {$league->current_pick}");
            return;
        }

        if ($league->draft_status !== 'in_progress') {
            \Log::info("Draft not in progress: {$league->draft_status}");
            return;
        }

        // Check if pick has actually expired
        if (!$league->isPickExpired()) {
            \Log::info("Pick not expired yet. Time remaining: {$league->getTimeRemaining()}");
            return;
        }

        $currentTeam = $league->getCurrentDraftTeam();

        if (!$currentTeam) {
            \Log::warning("No current team found");
            return;
        }

        \Log::info("Auto-picking for team: {$currentTeam->team_name}");

        // Perform the auto-pick
        app(DraftController::class)->performAutoPick($league, $currentTeam);

        \Log::info("Auto-pick completed");
    }
}
