<?php

namespace App\Console\Commands;

use App\Models\Player;
use Illuminate\Console\Command;

class RecalculatePlayerPrices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'players:recalculate-prices';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate all player prices based on their fantasy points performance';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Recalculating player prices based on performance...');

        $players = Player::where('is_active', true)->get();
        $updatedCount = 0;
        $skippedCount = 0;

        $progressBar = $this->output->createProgressBar($players->count());
        $progressBar->start();

        foreach ($players as $player) {
            $oldPrice = $player->price;
            $avgPoints = $player->average_fantasy_points;

            if ($avgPoints > 0) {
                $player->updatePriceBasedOnPerformance();
                $updatedCount++;

                $newPrice = $player->fresh()->price;
                if ($oldPrice != $newPrice) {
                    $this->newLine();
                    $this->line("  {$player->name}: $" . number_format($oldPrice / 1000000, 2) . "M → $" . number_format($newPrice / 1000000, 2) . "M (Avg FP: " . round($avgPoints, 1) . ")");
                }
            } else {
                $skippedCount++;
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->info("✓ Updated {$updatedCount} player prices");
        $this->warn("⊘ Skipped {$skippedCount} players (no stats yet)");

        // Show top 10 most valuable players
        $this->newLine();
        $this->info('Top 10 Most Valuable Players:');
        $this->newLine();

        $topPlayers = Player::whereHas('gameStats')
            ->orderBy('price', 'desc')
            ->limit(10)
            ->get();

        $headers = ['#', 'Player', 'Team', 'Price', 'Avg Fantasy Pts'];
        $rows = [];

        foreach ($topPlayers as $index => $player) {
            $rows[] = [
                $index + 1,
                $player->name,
                $player->team->name,
                '$' . number_format($player->price / 1000000, 2) . 'M',
                round($player->average_fantasy_points, 1),
            ];
        }

        $this->table($headers, $rows);

        return Command::SUCCESS;
    }
}
