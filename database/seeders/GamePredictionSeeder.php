<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Game;
use App\Models\Team;
use App\Models\Championship;
use App\Models\Prediction;
use App\Models\League;
use App\Models\LeagueMember;

class GamePredictionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Use the existing EuroLeague championship
        $championship = Championship::where('external_id', 'euroleague-2025')->first();

        if (!$championship) {
            echo "EuroLeague championship not found. Please run 'php artisan scrape:euroleague --teams' first.\n";
            return;
        }

        // Get existing EuroLeague teams
        $createdTeams = Team::where('championship_id', $championship->id)->get();

        // Get existing EuroLeague games
        $games = Game::where('championship_id', $championship->id)->get();

        if ($games->count() === 0) {
            echo "No EuroLeague games found. Please run 'php artisan scrape:euroleague --games' first.\n";
            return;
        }

        // Update some games to have finished status with scores for demo
        $samplesToFinish = $games->take(8);
        foreach ($samplesToFinish as $game) {
            $homeScore = rand(75, 95);
            $awayScore = rand(75, 95);

            // Ensure no ties
            if ($homeScore === $awayScore) {
                $homeScore += rand(1, 5);
            }

            $game->update([
                'status' => 'finished',
                'home_score' => $homeScore,
                'away_score' => $awayScore,
            ]);
        }

        // Get all leagues and their members
        $leagues = League::with('members.user')->get();

        foreach ($leagues as $league) {
            foreach ($league->members as $member) {
                // Create predictions for some finished games (these will be visible)
                $finishedGames = $games->filter(fn($g) => $g->status === 'finished');
                $gamesToPredict = $finishedGames->random(rand(3, min(6, $finishedGames->count())));

                foreach ($gamesToPredict as $game) {
                    $homePred = rand(70, 95); // EuroLeague scores are typically lower
                    $awayPred = rand(70, 95);

                    // Ensure no tie predictions
                    if ($homePred === $awayPred) {
                        $homePred += rand(1, 5);
                    }

                    // Calculate points based on accuracy
                    $points = $this->calculatePoints($homePred, $awayPred, $game->home_score, $game->away_score);

                    Prediction::create([
                        'user_id' => $member->user_id,
                        'league_id' => $league->id,
                        'game_id' => $game->id,
                        'home_score_prediction' => $homePred,
                        'away_score_prediction' => $awayPred,
                        'points_earned' => $points,
                        'predicted_at' => $game->scheduled_at->subHours(rand(1, 24)),
                    ]);
                }

                // Create predictions for upcoming games (these will NOT be visible to others)
                $upcomingGames = $games->filter(fn($g) => $g->status === 'scheduled');
                $upcomingToPredict = $upcomingGames->random(rand(1, min(3, $upcomingGames->count())));

                foreach ($upcomingToPredict as $game) {
                    $homePred = rand(70, 95); // EuroLeague scores
                    $awayPred = rand(70, 95);

                    if ($homePred === $awayPred) {
                        $homePred += rand(1, 5);
                    }

                    Prediction::create([
                        'user_id' => $member->user_id,
                        'league_id' => $league->id,
                        'game_id' => $game->id,
                        'home_score_prediction' => $homePred,
                        'away_score_prediction' => $awayPred,
                        'points_earned' => null, // No points yet as game hasn't finished
                        'predicted_at' => now()->subHours(rand(1, 12)),
                    ]);
                }
            }
        }

        echo "Created games and predictions for testing!\n";
        echo "Finished games: " . collect($games)->where('status', 'finished')->count() . "\n";
        echo "Upcoming games: " . collect($games)->where('status', 'scheduled')->count() . "\n";
        echo "Total predictions: " . Prediction::count() . "\n";
    }

    private function calculatePoints($homePred, $awayPred, $homeActual, $awayActual): int
    {
        // Simple scoring system for demo
        if ($homePred == $homeActual && $awayPred == $awayActual) {
            return 50; // Exact score
        }

        $predDiff = abs($homePred - $awayPred);
        $actualDiff = abs($homeActual - $awayActual);

        if ($predDiff == $actualDiff) {
            return 30; // Exact difference
        }

        if (abs($predDiff - $actualDiff) <= 5) {
            return 20; // Within 5
        }

        if (abs($predDiff - $actualDiff) <= 10) {
            return 15; // Within 10
        }

        // Check if predicted winner correctly
        $predWinner = $homePred > $awayPred ? 'home' : 'away';
        $actualWinner = $homeActual > $awayActual ? 'home' : 'away';

        if ($predWinner === $actualWinner) {
            return 10; // Winner only
        }

        return 0; // No points
    }
}