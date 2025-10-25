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
    protected $signature = 'rounds:process-prices {--round= : Specific round to process} {--force : Force reprocess already processed round} {--all : Process all unprocessed rounds}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process player prices for completed rounds and save to history (use --all for bulk processing)';

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

        // Process all rounds if --all flag is set
        if ($this->option('all')) {
            return $this->processAllRounds($championship);
        }

        // Determine which round to process
        $roundToProcess = $this->option('round')
            ? (int) $this->option('round')
            : $this->getNextRoundToProcess($championship);

        if (! $roundToProcess) {
            $this->warn('No rounds available to process.');

            return Command::SUCCESS;
        }

        return $this->processSingleRound($championship, $roundToProcess);
    }

    /**
     * Process all unprocessed rounds
     */
    private function processAllRounds(Championship $championship): int
    {
        $processedCount = 0;

        while (true) {
            $nextRound = $this->getNextRoundToProcess($championship);

            if (! $nextRound) {
                break; // No more rounds to process
            }

            $this->info("Processing Round {$nextRound}...");
            $this->newLine();

            $result = $this->processSingleRound($championship, $nextRound, false);

            if ($result === Command::SUCCESS) {
                $processedCount++;
            } elseif ($result === Command::INVALID) {
                // Round not finished yet, stop processing
                $this->warn("Stopped at Round {$nextRound} - games not finished yet.");
                break;
            } else {
                // Error occurred, stop processing
                break;
            }
        }

        $this->newLine();
        if ($processedCount > 0) {
            $this->info("✅ Processed {$processedCount} round(s) successfully!");
        } else {
            $this->warn('No rounds available to process.');
        }

        return Command::SUCCESS;
    }

    /**
     * Process a single round
     */
    private function processSingleRound(Championship $championship, int $roundToProcess, bool $showHeader = true): int
    {
        if ($showHeader) {
            $this->info("Processing Round {$roundToProcess}...");
            $this->newLine();
        }

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

            return Command::INVALID; // Return special code to signal "incomplete round"
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
                // Get game stats for THIS round only
                $statsThisRound = $player->gameStats()
                    ->whereHas('game', function ($query) use ($roundNumber, $championship) {
                        $query->where('championship_id', $championship->id)
                            ->where('round', $roundNumber)
                            ->where('status', 'finished');
                    })
                    ->get();

                $gamesPlayedInRound = $statsThisRound->count();
                $fantasyPointsThisRound = $statsThisRound->sum('fantasy_points');

                // Calculate price using weighted average (70% history + 30% current round)
                $price = $player->calculateWeightedPrice($fantasyPointsThisRound, $roundNumber);

                // If player played this round and got a price, update and activate
                if ($price !== null) {
                    $player->update(['price' => $price]);

                    if (! $player->is_active) {
                        $player->update(['is_active' => true]);
                    }

                    $updatedCount++;
                }

                // Calculate how many historical prices were used (for tracking)
                $historicalPricesCount = $player->priceHistories()
                    ->where('round_number', '<', $roundNumber)
                    ->whereNotNull('price')
                    ->count();
                $gamesUsedForCalculation = min($historicalPricesCount, 4); // Max 4 historical rounds

                // Save to price history (even if null - player didn't play)
                PlayerPriceHistory::updateOrCreate(
                    [
                        'player_id' => $player->id,
                        'round_number' => $roundNumber,
                    ],
                    [
                        'price' => $price,
                        'average_fantasy_points' => $gamesPlayedInRound > 0 ? $fantasyPointsThisRound / $gamesPlayedInRound : null,
                        'games_used' => $gamesUsedForCalculation,
                        'games_played_in_round' => $gamesPlayedInRound,
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
