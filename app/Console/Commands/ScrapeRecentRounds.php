<?php

namespace App\Console\Commands;

use App\Services\EuroLeaguePlayerScrapingService;
use App\Services\EuroLeagueScrapingService;
use Illuminate\Console\Command;

class ScrapeRecentRounds extends Command
{
    protected $signature = 'scrape:recent';

    protected $description = 'Smart scraper: Auto-detects fresh DB and scrapes all data, otherwise updates recent rounds only. Runs full workflow: games → stats → prices → team points → predictions';

    public function __construct(
        private EuroLeagueScrapingService $scrapingService,
        private EuroLeaguePlayerScrapingService $playerScrapingService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('🔄 Starting smart scraping workflow...');
        $this->newLine();

        try {
            // Check if this is a fresh database (no games yet)
            $totalGames = \App\Models\Game::count();
            $isFreshDatabase = $totalGames === 0;

            if ($isFreshDatabase) {
                $this->warn('⚠️  Fresh database detected - performing initial setup...');

                // Step 0a: Scrape teams (required before games)
                $this->info('Step 0a: Scraping teams...');
                $this->scrapingService->scrapeTeams();
                $this->info('✅ Teams scraped');
                $this->newLine();

                // Step 0b: Scrape players (required before stats)
                $this->info('Step 0b: Scraping players...');
                $this->playerScrapingService->scrapePlayers();
                $this->info('✅ Players scraped');
                $this->newLine();
            }

            // Step 1: Update recent rounds (games and scores)
            // On fresh DB this will scrape ALL rounds, on normal run only recent rounds
            $this->info('Step 1/5: Updating rounds...');
            $this->scrapingService->scrapeRecentRounds();
            $this->info('✅ Rounds updated');
            $this->newLine();

            // Step 2: Update player statistics for finished games
            $this->info('Step 2/5: Updating player statistics...');
            $this->playerScrapingService->scrapePlayerStats();
            $this->info('✅ Player statistics updated');
            $this->newLine();

            // Step 3: Process round prices (if any round is complete)
            $this->info('Step 3/5: Processing round prices...');
            // On fresh DB, process all rounds at once
            $pricesExitCode = $isFreshDatabase
                ? $this->call('rounds:process-prices', ['--all' => true])
                : $this->call('rounds:process-prices');
            $this->info('✅ Round prices processed');
            $this->newLine();

            // Step 4: Calculate fantasy team points
            $this->info('Step 4/5: Calculating fantasy team points...');
            $pointsExitCode = $this->call('fantasy:calculate-team-points');

            if ($pointsExitCode === 0) {
                $this->info('✅ Team points calculated');
            } else {
                $this->warn('⚠️  Team points calculation returned with warnings');
            }
            $this->newLine();

            // Step 5: Calculate prediction league scores
            $this->info('Step 5/5: Calculating prediction scores...');
            $predictionsExitCode = $this->call('predictions:calculate-scores');

            if ($predictionsExitCode === 0) {
                $this->info('✅ Prediction scores calculated');
            } else {
                $this->warn('⚠️  Prediction scores calculation returned with warnings');
            }

            $this->newLine();
            $this->info('✅ Smart scraping workflow completed successfully!');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('❌ Error during scraping: '.$e->getMessage());

            return Command::FAILURE;
        }
    }
}
