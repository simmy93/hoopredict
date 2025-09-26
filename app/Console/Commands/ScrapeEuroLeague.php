<?php

namespace App\Console\Commands;

use App\Services\EuroLeagueScrapingService;
use Illuminate\Console\Command;

class ScrapeEuroLeague extends Command
{
    protected $signature = 'scrape:euroleague {--teams : Only scrape teams} {--games : Only scrape games} {--scores : Only update scores}';
    protected $description = 'Scrape EuroLeague data including teams, games, and scores';

    private EuroLeagueScrapingService $scrapingService;

    public function __construct(EuroLeagueScrapingService $scrapingService)
    {
        parent::__construct();
        $this->scrapingService = $scrapingService;
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
            } else {
                $this->info('Scraping all data...');
                $this->scrapingService->scrapeAll();
            }

            $this->info('EuroLeague scraping completed successfully!');
        } catch (\Exception $e) {
            $this->error('Error during scraping: ' . $e->getMessage());
            return;
        }
    }
}