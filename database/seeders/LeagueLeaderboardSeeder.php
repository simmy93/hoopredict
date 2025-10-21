<?php

namespace Database\Seeders;

use App\Models\League;
use App\Models\LeagueLeaderboard;
use App\Models\LeagueMember;
use Illuminate\Database\Seeder;

class LeagueLeaderboardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all league members to create leaderboard entries for them
        $leagueMembers = LeagueMember::with(['league', 'user'])->get();

        foreach ($leagueMembers as $member) {
            // Skip if leaderboard entry already exists
            if (LeagueLeaderboard::where('league_id', $member->league_id)
                ->where('user_id', $member->user_id)
                ->exists()) {
                continue;
            }

            // Generate realistic test data
            $totalPredictions = rand(5, 25); // Random number of predictions
            $correctPredictions = rand(0, $totalPredictions);
            $totalPoints = 0;

            // Distribute prediction types realistically
            $exactScorePreds = rand(0, min(2, $correctPredictions)); // Very few exact scores
            $exactDiffPreds = rand(0, min(3, $correctPredictions - $exactScorePreds));
            $within5Preds = rand(0, min(5, $correctPredictions - $exactScorePreds - $exactDiffPreds));
            $within10Preds = rand(0, min(4, $correctPredictions - $exactScorePreds - $exactDiffPreds - $within5Preds));
            $winnerOnlyPreds = $correctPredictions - $exactScorePreds - $exactDiffPreds - $within5Preds - $within10Preds;

            // Calculate points based on scoring system (adjust these values as needed)
            $totalPoints = ($exactScorePreds * 50) +
                          ($exactDiffPreds * 30) +
                          ($within5Preds * 20) +
                          ($within10Preds * 15) +
                          ($winnerOnlyPreds * 10);

            $accuracyPercentage = $totalPredictions > 0
                ? round(($correctPredictions / $totalPredictions) * 100, 2)
                : 0;

            LeagueLeaderboard::create([
                'league_id' => $member->league_id,
                'user_id' => $member->user_id,
                'total_points' => $totalPoints,
                'total_predictions' => $totalPredictions,
                'correct_predictions' => $correctPredictions,
                'exact_score_predictions' => $exactScorePreds,
                'exact_difference_predictions' => $exactDiffPreds,
                'within_5_predictions' => $within5Preds,
                'within_10_predictions' => $within10Preds,
                'winner_only_predictions' => $winnerOnlyPreds,
                'accuracy_percentage' => $accuracyPercentage,
            ]);

            echo "Created leaderboard entry for {$member->user->name} in {$member->league->name} league\n";
        }

        echo "Leaderboard seeding completed!\n";
    }
}
