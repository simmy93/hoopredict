<?php

namespace Database\Seeders;

use App\Models\League;
use App\Models\LeagueLeaderboard;
use App\Models\LeagueMember;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdditionalLeaderboardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create additional test users
        $additionalUsers = [
            ['name' => 'Michael Jordan', 'email' => 'mj@example.com'],
            ['name' => 'LeBron James', 'email' => 'lebron@example.com'],
            ['name' => 'Kobe Bryant', 'email' => 'kobe@example.com'],
            ['name' => 'Stephen Curry', 'email' => 'steph@example.com'],
        ];

        $createdUsers = [];
        foreach ($additionalUsers as $userData) {
            // Skip if user already exists
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'email' => $userData['email'],
                    'email_verified_at' => now(),
                    'password' => bcrypt('password'),
                ]
            );
            $createdUsers[] = $user;
        }

        // Get all leagues and add some of these users as members
        $leagues = League::all();

        foreach ($leagues as $league) {
            // Add 2-3 random new users to each league
            $usersToAdd = collect($createdUsers)->random(rand(2, min(3, count($createdUsers))));

            foreach ($usersToAdd as $user) {
                // Skip if already a member
                if (LeagueMember::where('league_id', $league->id)->where('user_id', $user->id)->exists()) {
                    continue;
                }

                // Create league membership
                LeagueMember::create([
                    'league_id' => $league->id,
                    'user_id' => $user->id,
                    'role' => 'member',
                    'joined_at' => now()->subDays(rand(1, 30)),
                ]);

                // Create leaderboard entry with more varied stats
                $scenarios = [
                    // High performer
                    ['predictions' => rand(20, 30), 'accuracy' => rand(70, 90), 'bonus_multiplier' => 1.5],
                    // Average performer
                    ['predictions' => rand(15, 25), 'accuracy' => rand(50, 70), 'bonus_multiplier' => 1.0],
                    // New player
                    ['predictions' => rand(5, 15), 'accuracy' => rand(40, 80), 'bonus_multiplier' => 1.2],
                    // Inconsistent player
                    ['predictions' => rand(10, 20), 'accuracy' => rand(30, 60), 'bonus_multiplier' => 0.8],
                ];

                $scenario = $scenarios[array_rand($scenarios)];
                $totalPredictions = $scenario['predictions'];
                $targetAccuracy = $scenario['accuracy'];
                $correctPredictions = round($totalPredictions * ($targetAccuracy / 100));

                // More realistic distribution of prediction types
                $exactScorePreds = rand(0, min(3, $correctPredictions));
                $exactDiffPreds = rand(0, min(4, $correctPredictions - $exactScorePreds));
                $within5Preds = rand(0, min(6, $correctPredictions - $exactScorePreds - $exactDiffPreds));
                $within10Preds = rand(0, min(5, $correctPredictions - $exactScorePreds - $exactDiffPreds - $within5Preds));
                $winnerOnlyPreds = max(0, $correctPredictions - $exactScorePreds - $exactDiffPreds - $within5Preds - $within10Preds);

                // Calculate points with scenario bonus
                $basePoints = ($exactScorePreds * 50) +
                             ($exactDiffPreds * 30) +
                             ($within5Preds * 20) +
                             ($within10Preds * 15) +
                             ($winnerOnlyPreds * 10);

                $totalPoints = round($basePoints * $scenario['bonus_multiplier']);

                $accuracyPercentage = $totalPredictions > 0
                    ? round(($correctPredictions / $totalPredictions) * 100, 2)
                    : 0;

                LeagueLeaderboard::create([
                    'league_id' => $league->id,
                    'user_id' => $user->id,
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

                echo "Added {$user->name} to {$league->name} with {$totalPoints} points ({$accuracyPercentage}% accuracy)\n";
            }
        }

        echo "Additional leaderboard seeding completed!\n";
    }
}
