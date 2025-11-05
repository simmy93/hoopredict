<?php

namespace App\Console\Commands;

use App\Models\Championship;
use App\Models\FantasyTeam;
use App\Models\FantasyTeamRoundPoints;
use App\Models\Game;
use Illuminate\Console\Command;

class CalculateTeamPoints extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fantasy:calculate-team-points
                            {--round= : Calculate for specific round (default: latest finished round)}
                            {--championship-id= : Championship ID (default: active championship)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calculate fantasy team points based on player performance with position multipliers (Starters: 100%, Sixth Man: 75%, Bench: 50%)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $championshipId = $this->option('championship-id');
        $roundNumber = $this->option('round');

        // Get EuroLeague championship
        $championship = $championshipId
            ? Championship::find($championshipId)
            : Championship::where('is_active', true)->first();

        if (!$championship) {
            $this->error('Championship not found');
            return Command::FAILURE;
        }

        // Determine which round to process
        if (!$roundNumber) {
            // Get the latest finished round
            $latestFinishedRound = Game::where('championship_id', $championship->id)
                ->where('status', 'finished')
                ->whereNotNull('home_score')
                ->max('round');

            if (!$latestFinishedRound) {
                $this->error('No finished rounds found');
                return Command::FAILURE;
            }

            $roundNumber = $latestFinishedRound;
        }

        $this->info("Calculating team points for Round {$roundNumber}...");

        // Get all fantasy teams for this championship
        $teams = FantasyTeam::whereHas('fantasyLeague', function ($query) use ($championship) {
            $query->where('championship_id', $championship->id);
        })->with(['fantasyTeamPlayers.player.gameStats' => function ($query) use ($roundNumber, $championship) {
            $query->whereHas('game', function ($q) use ($roundNumber, $championship) {
                $q->where('championship_id', $championship->id)
                  ->where('round', $roundNumber)
                  ->where('status', 'finished');
            });
        }])->get();

        if ($teams->isEmpty()) {
            $this->warn('No fantasy teams found for this championship');
            return Command::SUCCESS;
        }

        $teamsUpdated = 0;

        foreach ($teams as $team) {
            $totalPoints = 0;

            foreach ($team->fantasyTeamPlayers as $teamPlayer) {
                // Get player's fantasy points for this round
                $roundPoints = $teamPlayer->player->gameStats->sum('fantasy_points');

                if ($roundPoints <= 0) {
                    continue;
                }

                // Apply multiplier based on lineup position
                $multiplier = 0.5; // Default: bench (50%)

                if ($teamPlayer->lineup_position) {
                    if ($teamPlayer->lineup_position >= 1 && $teamPlayer->lineup_position <= 5) {
                        // Starters (positions 1-5): 100%
                        $multiplier = 1.0;
                    } elseif ($teamPlayer->lineup_position === 6) {
                        // Sixth man: 75%
                        $multiplier = 0.75;
                    }
                }

                $adjustedPoints = $roundPoints * $multiplier;
                $totalPoints += $adjustedPoints;

                $this->line("  {$teamPlayer->player->name}: {$roundPoints} FP × {$multiplier} = {$adjustedPoints} points");
            }

            // Store round-specific points
            FantasyTeamRoundPoints::updateOrCreate(
                [
                    'fantasy_team_id' => $team->id,
                    'round' => $roundNumber,
                ],
                [
                    'points' => round($totalPoints, 2),
                ]
            );

            // Update team's cumulative total points
            // Sum all round points to get accurate cumulative total
            $cumulativeTotal = FantasyTeamRoundPoints::where('fantasy_team_id', $team->id)
                ->sum('points');

            $team->total_points = round($cumulativeTotal, 2);
            $team->save();

            $this->info("✓ {$team->team_name}: Round {$roundNumber}: " . round($totalPoints, 2) . " pts | Total: {$team->total_points} pts");
            $teamsUpdated++;
        }

        $this->newLine();
        $this->info("Successfully calculated points for {$teamsUpdated} teams in Round {$roundNumber}");

        return Command::SUCCESS;
    }
}
