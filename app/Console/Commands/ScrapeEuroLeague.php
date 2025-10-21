<?php

namespace App\Console\Commands;

use App\Services\EuroLeaguePlayerScrapingService;
use App\Services\EuroLeagueScrapingService;
use Illuminate\Console\Command;

class ScrapeEuroLeague extends Command
{
    protected $signature = 'scrape:euroleague {--teams : Only scrape teams} {--games : Only scrape games} {--scores : Only update scores} {--players : Only scrape players} {--stats : Only scrape player statistics} {--all-history : Include all historical games regardless of date}';

    protected $description = 'Scrape EuroLeague data including teams, games, players, and scores';

    private EuroLeagueScrapingService $scrapingService;

    private EuroLeaguePlayerScrapingService $playerScrapingService;

    public function __construct(
        EuroLeagueScrapingService $scrapingService,
        EuroLeaguePlayerScrapingService $playerScrapingService
    ) {
        parent::__construct();
        $this->scrapingService = $scrapingService;
        $this->playerScrapingService = $playerScrapingService;
    }

    public function handle(): void
    {
        $this->info('Starting EuroLeague scraping...');

        // Determine if we should ignore old games (default: true, unless --all-history is set)
        $ignoreOldGames = ! $this->option('all-history');

        if ($this->option('all-history')) {
            $this->warn('⚠️  --all-history flag enabled: Scraping ALL historical games regardless of date');
        }

        try {
            if ($this->option('teams')) {
                $this->info('Scraping teams only...');
                $this->scrapingService->scrapeTeams();
            } elseif ($this->option('games')) {
                $this->info('Scraping games only...');
                $this->scrapingService->scrapeGames($ignoreOldGames);
            } elseif ($this->option('scores')) {
                $this->info('Updating scores only...');
                $this->scrapingService->updateGameScores();
            } elseif ($this->option('players')) {
                $this->info('Scraping players only...');
                $this->playerScrapingService->scrapePlayers();
            } elseif ($this->option('stats')) {
                $this->info('Scraping player statistics only...');
                $this->playerScrapingService->scrapePlayerStats();
            } else {
                $this->info('Scraping all data (teams, games, players, stats)...');
                $this->scrapingService->scrapeTeams();
                $this->scrapingService->scrapeGames($ignoreOldGames);
                $this->playerScrapingService->scrapePlayers();
                $this->scrapingService->updateGameScores();
                $this->playerScrapingService->scrapePlayerStats();
                $this->scrapingService->cleanupOldGames();
            }

            $this->info('EuroLeague scraping completed successfully!');
        } catch (\Exception $e) {
            $this->error('Error during scraping: '.$e->getMessage());

            return;
        }
    }
}
