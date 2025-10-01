<?php

namespace App\Console\Commands;

use App\Services\EuroLeagueScrapingService;
use App\Services\EuroLeaguePlayerScrapingService;
use Illuminate\Console\Command;

class ScrapeEuroLeague extends Command
{
    protected $signature = 'scrape:euroleague {--teams : Only scrape teams} {--games : Only scrape games} {--scores : Only update scores} {--players : Only scrape players}';
    protected $description = 'Scrape EuroLeague data including teams, games, players, and scores';

    private EuroLeagueScrapingService $scrapingService;
    private EuroLeaguePlayerScrapingService $playerScrapingService;

    public function __construct(
        EuroLeagueScrapingService $scrapingService,
        EuroLeaguePlayerScrapingService $playerScrapingService
    )
    {
        parent::__construct();
        $this->scrapingService = $scrapingService;
        $this->playerScrapingService = $playerScrapingService;
    }

    public function handle(): void
    {
        $this->info('Starting EuroLeague scraping...');

        try {
            if ($this->option('teams')) {
                $this->info('Scraping teams only...');
                $this->scrapingService->scrapeTeams();
            } elseif ($this->option('games')) {
                $this->info('Scraping games only...');
                $this->scrapingService->scrapeGames();
            } elseif ($this->option('scores')) {
                $this->info('Updating scores only...');
                $this->scrapingService->updateGameScores();
            } elseif ($this->option('players')) {
                $this->info('Scraping players only...');
                $this->playerScrapingService->scrapePlayers();
            } else {
                $this->info('Scraping all data (teams, games, players)...');
                $this->scrapingService->scrapeTeams();
                $this->scrapingService->scrapeGames();
                $this->playerScrapingService->scrapePlayers();
                $this->scrapingService->updateGameScores();
                $this->scrapingService->cleanupOldGames();
            }

            $this->info('EuroLeague scraping completed successfully!');
        } catch (\Exception $e) {
            $this->error('Error during scraping: ' . $e->getMessage());
            return;
        }
    }
}