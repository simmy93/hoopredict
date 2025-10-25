<?php

namespace App\Console\Commands;

use App\Models\League;
use App\Models\LeagueLeaderboard;
use App\Models\Prediction;
use Illuminate\Console\Command;

class CalculatePredictionScores extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'predictions:calculate-scores
                            {--league= : Calculate for specific league ID only}
                            {--force : Recalculate all predictions (default: only unscored)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calculate prediction scores and update league leaderboards (30pts exact, 15pts exact diff, 10pts within 5, 7pts within 10, 4pts winner)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🏀 Calculating prediction scores...');
        $this->newLine();

        $leagueId = $this->option('league');
        $force = $this->option('force');

        try {
            // Step 1: Calculate individual prediction scores
            $this->info('Step 1/2: Calculating prediction points...');
            $updatedPredictions = $this->calculatePredictionPoints($leagueId, $force);
            $this->info("✅ Updated {$updatedPredictions} predictions");
            $this->newLine();

            // Step 2: Update league leaderboards
            $this->info('Step 2/2: Updating league leaderboards...');
            $updatedLeaderboards = $this->updateLeagueLeaderboards($leagueId);
            $this->info("✅ Updated {$updatedLeaderboards} leaderboard entries");
            $this->newLine();

            $this->info('✅ Prediction scores calculated successfully!');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('❌ Error calculating scores: '.$e->getMessage());
            $this->error($e->getTraceAsString());

            return Command::FAILURE;
        }
    }

    /**
     * Calculate points for predictions with finished games
     */
    private function calculatePredictionPoints(?int $leagueId, bool $force): int
    {
        $query = Prediction::whereHas('game', function ($q) {
            $q->where('status', 'finished')
                ->whereNotNull('home_score')
                ->whereNotNull('away_score');
        });

        if ($leagueId) {
            $query->where('league_id', $leagueId);
        }

        // Only process unscored predictions unless force flag is set
        if (! $force) {
            $query->whereNull('points_earned');
        }

        $predictions = $query->with('game')->get();

        $updated = 0;

        foreach ($predictions as $prediction) {
            // Use the model's calculatePoints method which has the correct logic and scoring
            $points = $prediction->calculatePoints();

            if ($prediction->points_earned !== $points) {
                $prediction->points_earned = $points;
                $prediction->save();
                $updated++;
            }
        }

        return $updated;
    }

    /**
     * Update league leaderboards with aggregated statistics
     */
    private function updateLeagueLeaderboards(?int $leagueId): int
    {
        $query = League::query();

        if ($leagueId) {
            $query->where('id', $leagueId);
        }

        $leagues = $query->with('members')->get();
        $updated = 0;

        foreach ($leagues as $league) {
            foreach ($league->members as $member) {
                $predictions = Prediction::where('league_id', $league->id)
                    ->where('user_id', $member->user_id)
                    ->whereHas('game', function ($q) {
                        $q->where('status', 'finished');
                    })
                    ->whereNotNull('points_earned')
                    ->get();

                $totalPoints = $predictions->sum('points_earned');
                $totalPredictions = $predictions->count();

                // Based on the actual scoring system in Prediction model:
                // 30 = exact score, 15 = exact difference, 10 = within 5, 7 = within 10, 4 = winner only
                $exactScore = $predictions->where('scoring_method', 'exact_score')->count();
                $exactDiff = $predictions->where('scoring_method', 'exact_difference')->count();
                $within5 = $predictions->where('scoring_method', 'within_5')->count();
                $within10 = $predictions->where('scoring_method', 'within_10')->count();
                $winnerOnly = $predictions->where('scoring_method', 'winner_only')->count();

                $correct = $exactScore + $exactDiff + $within5 + $within10 + $winnerOnly;
                $accuracy = $totalPredictions > 0 ? ($correct / $totalPredictions) * 100 : 0;

                LeagueLeaderboard::updateOrCreate(
                    ['league_id' => $league->id, 'user_id' => $member->user_id],
                    [
                        'total_points' => $totalPoints,
                        'total_predictions' => $totalPredictions,
                        'correct_predictions' => $correct,
                        'exact_score_predictions' => $exactScore,
                        'exact_difference_predictions' => $exactDiff,
                        'winner_only_predictions' => $winnerOnly,
                        'within_5_predictions' => $within5,
                        'within_10_predictions' => $within10,
                        'accuracy_percentage' => round($accuracy, 2),
                    ]
                );

                $updated++;
            }
        }

        return $updated;
    }
}