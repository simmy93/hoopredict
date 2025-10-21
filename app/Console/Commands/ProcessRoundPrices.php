<?php

namespace App\Console\Commands;

use App\Models\Championship;
use App\Models\Game;
use App\Models\Player;
use App\Models\PlayerPriceHistory;
use App\Models\RoundProcessingStatus;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessRoundPrices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rounds:process-prices {--round= : Specific round to process} {--force : Force reprocess already processed round}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process player prices for completed rounds and save to history';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🏀 Starting round price processing...');
        $this->newLine();

        // Get EuroLeague championship
        $championship = Championship::where('external_id', 'euroleague-2025')->first();

        if (! $championship) {
            $this->error('EuroLeague championship not found. Please run scraping first.');

            return Command::FAILURE;
        }

        // Determine which round to process
        $roundToProcess = $this->option('round')
            ? (int) $this->option('round')
            : $this->getNextRoundToProcess($championship);

        if (! $roundToProcess) {
            $this->warn('No rounds available to process.');

            return Command::SUCCESS;
        }

        $this->info("Processing Round {$roundToProcess}...");
        $this->newLine();

        // Check if round already processed
        $existingStatus = RoundProcessingStatus::where('championship_id', $championship->id)
            ->where('round_number', $roundToProcess)
            ->first();

        if ($existingStatus && ! $this->option('force')) {
            $this->warn("Round {$roundToProcess} was already processed at {$existingStatus->processed_at}");
            $this->info('Use --force to reprocess this round.');

            return Command::SUCCESS;
        }

        // Get all games from this round
        $games = Game::where('championship_id', $championship->id)
            ->where('round', $roundToProcess)
            ->get();

        if ($games->isEmpty()) {
            $this->error("No games found for round {$roundToProcess}");

            return Command::FAILURE;
        }

        $totalGames = $games->count();
        $finishedGames = $games->where('status', 'finished')->count();

        $this->info("Round {$roundToProcess}: {$finishedGames}/{$totalGames} games finished");

        // Check if all games are finished
        if ($finishedGames < $totalGames) {
            $this->warn("Not all games in round {$roundToProcess} are finished yet.");
            $this->info("Finished: {$finishedGames}/{$totalGames}");

            return Command::SUCCESS;
        }

        // Process player prices for this round
        $playersUpdated = $this->processRound($championship, $roundToProcess);

        // Save processing status
        RoundProcessingStatus::updateOrCreate(
            [
                'championship_id' => $championship->id,
                'round_number' => $roundToProcess,
            ],
            [
                'processed_at' => now(),
                'total_games' => $totalGames,
                'finished_games' => $finishedGames,
                'players_updated' => $playersUpdated,
            ]
        );

        $this->newLine();
        $this->info("✅ Round {$roundToProcess} processed successfully!");
        $this->info("📊 Updated {$playersUpdated} player prices");

        return Command::SUCCESS;
    }

    /**
     * Get the next round number to process
     */
    private function getNextRoundToProcess(Championship $championship): ?int
    {
        // Get the last processed round
        $lastProcessed = RoundProcessingStatus::where('championship_id', $championship->id)
            ->orderBy('round_number', 'desc')
            ->first();

        $nextRound = $lastProcessed ? $lastProcessed->round_number + 1 : 1;

        // Check if this round has games
        $hasGames = Game::where('championship_id', $championship->id)
            ->where('round', $nextRound)
            ->exists();

        return $hasGames ? $nextRound : null;
    }

    /**
     * Process all players for a specific round
     */
    private function processRound(Championship $championship, int $roundNumber): int
    {
        $this->info("Calculating prices based on games up to round {$roundNumber}...");
        $this->newLine();

        // Get all active players
        $players = Player::whereHas('team', function ($query) use ($championship) {
            $query->where('championship_id', $championship->id);
        })->get();

        $progressBar = $this->output->createProgressBar($players->count());
        $progressBar->start();

        $updatedCount = 0;

        DB::beginTransaction();
        try {
            foreach ($players as $player) {
                // Get all game stats up to and including this round
                $statsUpToRound = $player->gameStats()
                    ->whereHas('game', function ($query) use ($roundNumber, $championship) {
                        $query->where('championship_id', $championship->id)
                            ->where('round', '<=', $roundNumber)
                            ->where('status', 'finished');
                    })
                    ->orderBy('created_at', 'desc')
                    ->get();

                $totalGamesPlayed = $statsUpToRound->count();
                $gamesInThisRound = $statsUpToRound->filter(function ($stat) use ($roundNumber) {
                    return $stat->game->round == $roundNumber;
                })->count();

                // Determine how many games to use for pricing (5, 3, 1, or 0)
                $gamesUsed = match (true) {
                    $totalGamesPlayed >= 5 => 5,
                    $totalGamesPlayed >= 3 => 3,
                    $totalGamesPlayed >= 1 => 1,
                    default => 0
                };

                $price = null;
                $avgFantasyPoints = null;

                if ($gamesUsed > 0) {
                    // Calculate average from the appropriate number of recent games
                    $recentStats = $statsUpToRound->take($gamesUsed);
                    $avgFantasyPoints = $recentStats->avg('fantasy_points');

                    // Calculate price using the same formula as the model
                    $price = $avgFantasyPoints * 100000;
                    $price = max($price, 100000);  // Minimum 100k
                    $price = min($price, 10000000); // Maximum 10M
                    $price = round($price, -4); // Round to nearest 10k

                    // Update player's current price
                    $player->update(['price' => $price]);

                    // Activate player if they have stats
                    if (! $player->is_active) {
                        $player->update(['is_active' => true]);
                    }

                    $updatedCount++;
                }

                // Save to price history
                PlayerPriceHistory::updateOrCreate(
                    [
                        'player_id' => $player->id,
                        'round_number' => $roundNumber,
                    ],
                    [
                        'price' => $price,
                        'average_fantasy_points' => $avgFantasyPoints,
                        'games_used' => $gamesUsed,
                        'games_played_in_round' => $gamesInThisRound,
                    ]
                );

                $progressBar->advance();
            }

            DB::commit();
            $progressBar->finish();
            $this->newLine();

            return $updatedCount;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Error processing round: '.$e->getMessage());
            Log::error('Error processing round prices', [
                'round' => $roundNumber,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}
