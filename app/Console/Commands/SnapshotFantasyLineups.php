<?php

namespace App\Console\Commands;

use App\Models\Championship;
use App\Models\FantasyLeague;
use App\Models\FantasyTeam;
use App\Models\FantasyTeamLineupHistory;
use App\Models\Game;
use App\Models\RoundProcessingStatus;
use Illuminate\Console\Command;

class SnapshotFantasyLineups extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fantasy:snapshot-lineups {--round= : Specific round to snapshot} {--force : Re-snapshot even if already exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Snapshot fantasy team lineups when rounds lock (become active) - captures the frozen lineup used for scoring';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $specificRound = $this->option('round');
        $force = $this->option('force');

        // Get all championships that have fantasy leagues
        $championshipIds = FantasyLeague::distinct()->pluck('championship_id');
        $championships = Championship::whereIn('id', $championshipIds)->get();

        if ($championships->isEmpty()) {
            $this->warn('No championships with fantasy leagues found.');
            return Command::SUCCESS;
        }

        $totalSnapshotted = 0;

        foreach ($championships as $championship) {
            if ($specificRound) {
                // Manual snapshot of specific round (force mode)
                $snapshotted = $this->snapshotRound($championship->id, $specificRound, $force);
                $totalSnapshotted += $snapshotted;
                if ($snapshotted > 0) {
                    $this->info("Snapshotted {$snapshotted} teams for round {$specificRound}");
                }
            } else {
                // Check if there's an active (locked) round that needs snapshotting
                $activeRound = Game::getCurrentActiveRound($championship->id);

                if ($activeRound) {
                    // Round is active! Check if we've already snapshotted it
                    $status = RoundProcessingStatus::firstOrCreate(
                        [
                            'championship_id' => $championship->id,
                            'round_number' => $activeRound,
                        ],
                        [
                            'processed_at' => now(),
                            'total_games' => 0,
                            'finished_games' => 0,
                            'players_updated' => 0,
                        ]
                    );

                    if (!$status->lineups_snapshotted || $force) {
                        // Round just locked or force mode! Snapshot all lineups NOW
                        $snapshotted = $this->snapshotRound($championship->id, $activeRound, $force);
                        $totalSnapshotted += $snapshotted;

                        if ($snapshotted > 0) {
                            $status->update([
                                'lineups_snapshotted' => true,
                                'lineups_snapshotted_at' => now(),
                            ]);
                            $this->info("✓ Captured Round {$activeRound} lineups at lock time ({$snapshotted} teams)");
                        }
                    }
                }
            }
        }

        if ($totalSnapshotted > 0) {
            $this->info("✓ Total: Snapshotted {$totalSnapshotted} team lineups");
        } else {
            // Silence is golden - no action needed
        }

        return Command::SUCCESS;
    }

    /**
     * Snapshot all fantasy team lineups for a specific round.
     */
    private function snapshotRound(int $championshipId, int $round, bool $force): int
    {
        $count = 0;

        // Get all fantasy leagues for this championship
        $fantasyLeagues = FantasyLeague::where('championship_id', $championshipId)->get();

        foreach ($fantasyLeagues as $league) {
            // Get all teams in this league
            $teams = FantasyTeam::where('fantasy_league_id', $league->id)->get();

            foreach ($teams as $team) {
                // Check if snapshot already exists for this team and round
                $existingSnapshot = FantasyTeamLineupHistory::where('fantasy_team_id', $team->id)
                    ->where('round', $round)
                    ->exists();

                if ($existingSnapshot && !$force) {
                    continue; // Skip if already snapshotted
                }

                // Delete existing snapshot if force flag is set
                if ($existingSnapshot && $force) {
                    FantasyTeamLineupHistory::where('fantasy_team_id', $team->id)
                        ->where('round', $round)
                        ->delete();
                }

                // Snapshot current lineup for this team
                $teamPlayers = $team->fantasyTeamPlayers;

                foreach ($teamPlayers as $teamPlayer) {
                    FantasyTeamLineupHistory::create([
                        'fantasy_team_id' => $team->id,
                        'round' => $round,
                        'fantasy_team_player_id' => $teamPlayer->id,
                        'lineup_position' => $teamPlayer->lineup_position,
                        'is_captain' => $teamPlayer->is_captain,
                    ]);
                }

                $count++;
            }
        }

        return $count;
    }
}
