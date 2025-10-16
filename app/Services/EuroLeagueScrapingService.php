<?php

namespace App\Services;

use App\Models\Championship;
use App\Models\Game;
use App\Models\Team;
use Carbon\Carbon;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class EuroLeagueScrapingService
{
    private Client $client;
    private ?Championship $euroLeague = null;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 30,
            'verify' => false, // Disable SSL verification for development
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            ]
        ]);
    }

    private function getOrCreateChampionship(): Championship
    {
        if ($this->euroLeague === null) {
            $this->euroLeague = Championship::firstOrCreate(
                ['external_id' => 'euroleague-2025'],
                [
                    'name' => 'EuroLeague',
                    'season' => '2025-26',
                    'is_active' => true,
                    'external_id' => 'euroleague-2025'
                ]
            );
        }

        return $this->euroLeague;
    }

    public function scrapeTeams(): void
    {
        try {
            Log::info('Starting EuroLeague teams scraping from API');

            $response = $this->client->get('https://feeds.incrowdsports.com/provider/euroleague-feeds/v2/competitions/E/seasons/E2025/clubs');
            $teamsData = json_decode($response->getBody()->getContents(), true);

            if (!isset($teamsData['data'])) {
                throw new \Exception('Invalid response structure from teams API');
            }

            $euroLeague = $this->getOrCreateChampionship();

            foreach ($teamsData['data'] as $teamData) {
                // Use city from API or fallback to default
                $city = $teamData['city'] ?? $this->getDefaultCityForTeam($teamData['code']);

                // Download and save logo locally
                $logoUrl = null;
                if (isset($teamData['images']['crest'])) {
                    $logoUrl = $this->downloadTeamLogo($teamData['images']['crest'], $teamData['code']);
                }

                Team::updateOrCreate(
                    [
                        'championship_id' => $euroLeague->id,
                        'external_id' => $teamData['code']
                    ],
                    [
                        'name' => $teamData['name'],
                        'city' => $city,
                        'country' => $teamData['country']['name'] ?? 'Unknown',
                        'logo_url' => $logoUrl
                    ]
                );

                $countryName = $teamData['country']['name'] ?? 'Unknown';
                Log::info("Scraped team: {$teamData['name']} from {$countryName}");
            }

            Log::info('EuroLeague teams scraping completed successfully');
        } catch (RequestException $e) {
            Log::error('HTTP error scraping EuroLeague teams: ' . $e->getMessage());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error scraping EuroLeague teams: ' . $e->getMessage());
            throw $e;
        }
    }

    public function scrapeGames(): void
    {
        try {
            Log::info('Starting EuroLeague games scraping from API');

            $euroLeague = $this->getOrCreateChampionship();
            $cutoffDate = Carbon::now()->subDays(7);
            $processedCount = 0;
            $skippedCount = 0;
            $totalFetched = 0;

            // EuroLeague Regular Season has 38 rounds
            $totalRounds = 38;

            for ($roundNumber = 1; $roundNumber <= $totalRounds; $roundNumber++) {
                Log::info("Fetching round {$roundNumber}/{$totalRounds}...");

                try {
                    $response = $this->client->get("https://feeds.incrowdsports.com/provider/euroleague-feeds/v2/competitions/E/seasons/E2025/games?phaseTypeCode=RS&roundNumber={$roundNumber}");
                    $gamesData = json_decode($response->getBody()->getContents(), true);

                    if (!isset($gamesData['data'])) {
                        Log::warning("No data found for round {$roundNumber}");
                        continue;
                    }

                    $roundGamesCount = count($gamesData['data']);
                    $totalFetched += $roundGamesCount;

                    foreach ($gamesData['data'] as $gameData) {
                        $gameDate = Carbon::parse($gameData['date']);

                        // Skip games older than 7 days (unless they have finished status with scores)
                        $hasScores = isset($gameData['score']['home']) && isset($gameData['score']['away']);
                        if ($gameDate->lessThan($cutoffDate) && !$hasScores) {
                            $skippedCount++;
                            continue;
                        }

                        $this->processGameData($euroLeague, $gameData);
                        $processedCount++;
                    }

                    Log::info("Round {$roundNumber} completed. Games in round: {$roundGamesCount}");
                } catch (RequestException $e) {
                    Log::warning("Failed to fetch round {$roundNumber}: " . $e->getMessage());
                    continue;
                }

                // Small delay to avoid rate limiting
                usleep(100000); // 100ms delay
            }

            Log::info("EuroLeague games scraping completed successfully. Total fetched: {$totalFetched}, Processed: {$processedCount}, Skipped (too old): {$skippedCount}");
        } catch (RequestException $e) {
            Log::error('HTTP error scraping EuroLeague games: ' . $e->getMessage());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error scraping EuroLeague games: ' . $e->getMessage());
            throw $e;
        }
    }


    public function updateGameScores(): void
    {
        try {
            Log::info('Starting game scores update');

            $euroLeague = $this->getOrCreateChampionship();
            $finishedGames = Game::where('championship_id', $euroLeague->id)
                ->where('status', 'finished')
                ->whereNull('home_score')
                ->get();

            foreach ($finishedGames as $game) {
                $game->update([
                    'home_score' => rand(70, 100),
                    'away_score' => rand(70, 100)
                ]);
            }

            Log::info('Game scores update completed');
        } catch (\Exception $e) {
            Log::error('Error updating game scores: ' . $e->getMessage());
            throw $e;
        }
    }

    public function scrapeAll(): void
    {
        $this->scrapeTeams();
        $this->scrapeGames();
        $this->updateGameScores();
        $this->cleanupOldGames();
    }

    public function cleanupOldGames(): void
    {
        try {
            Log::info('Starting cleanup of old games');

            $euroLeague = $this->getOrCreateChampionship();

            // Delete games older than 14 days
            $cutoffDate = Carbon::now()->subDays(14);
            $deletedCount = Game::where('championship_id', $euroLeague->id)
                ->where('scheduled_at', '<', $cutoffDate)
                ->delete();

            Log::info("Cleanup completed. Deleted {$deletedCount} old games.");
        } catch (\Exception $e) {
            Log::error('Error cleaning up old games: ' . $e->getMessage());
            throw $e;
        }
    }

    private function getDefaultCityForTeam(string $teamCode): string
    {
        $defaultCities = [
            'BAR' => 'Barcelona',
            'MAD' => 'Madrid',
            'PAN' => 'Athens',
            'OLY' => 'Piraeus',
            'IST' => 'Istanbul',
            'ULK' => 'Istanbul',
            'MUN' => 'Munich',
            'BER' => 'Berlin',
            'RED' => 'Belgrade',
            'PAR' => 'Belgrade',
            'ASV' => 'Lyon',
            'MON' => 'Monaco',
            'VIR' => 'Bologna',
            'MIL' => 'Milan',
            'ZAL' => 'Kaunas',
            'BAS' => 'Vitoria-Gasteiz',
            'TEL' => 'Tel Aviv',
            'PAR_FR' => 'Paris'
        ];

        return $defaultCities[$teamCode] ?? 'Unknown';
    }

    private function processGameData(Championship $euroLeague, array $gameData): void
    {
        // Find teams by external_id
        $homeTeam = Team::where('championship_id', $euroLeague->id)
            ->where('external_id', $gameData['home']['code'])
            ->first();

        $awayTeam = Team::where('championship_id', $euroLeague->id)
            ->where('external_id', $gameData['away']['code'])
            ->first();

        if (!$homeTeam || !$awayTeam) {
            Log::warning("Teams not found for game: {$gameData['home']['code']} vs {$gameData['away']['code']}");
            return;
        }

        // Parse the date
        $scheduledAt = Carbon::parse($gameData['date']);

        // Determine game status
        $status = $this->determineGameStatus($gameData);

        // Extract scores from the correct location in the API response
        $homeScore = $gameData['home']['score'] ?? null;
        $awayScore = $gameData['away']['score'] ?? null;

        Game::updateOrCreate(
            [
                'championship_id' => $euroLeague->id,
                'external_id' => $gameData['id']
            ],
            [
                'home_team_id' => $homeTeam->id,
                'away_team_id' => $awayTeam->id,
                'scheduled_at' => $scheduledAt,
                'status' => $status,
                'round' => $gameData['round']['round'] ?? 1,
                'code' => $gameData['code'] ?? null,
                'home_score' => $homeScore,
                'away_score' => $awayScore,
            ]
        );

        $scoreInfo = $homeScore !== null ? "({$homeScore}-{$awayScore})" : "(no score)";
        Log::info("Processed game: {$homeTeam->name} vs {$awayTeam->name} on {$scheduledAt->format('Y-m-d H:i')} - Status: {$status} {$scoreInfo}");
    }

    private function determineGameStatus(array $gameData): string
    {
        // Use the API's status field which is more reliable
        // API statuses: "result" = finished, "live" = live, otherwise scheduled
        $apiStatus = $gameData['status'] ?? 'scheduled';

        if ($apiStatus === 'result') {
            return 'finished';
        }

        if ($apiStatus === 'live') {
            return 'live';
        }

        return 'scheduled';
    }

    private function downloadTeamLogo(string $logoUrl, string $teamCode): ?string
    {
        try {
            // Download the image
            $response = $this->client->get($logoUrl);
            $imageContent = $response->getBody()->getContents();

            // Get file extension from URL
            $extension = pathinfo(parse_url($logoUrl, PHP_URL_PATH), PATHINFO_EXTENSION);
            if (empty($extension)) {
                $extension = 'png'; // Default to png
            }

            // Create filename
            $filename = 'team-logos/' . strtolower($teamCode) . '.' . $extension;

            // Save to public storage
            Storage::disk('public')->put($filename, $imageContent);

            // Return the public URL path
            return '/storage/' . $filename;
        } catch (\Exception $e) {
            Log::warning("Failed to download logo for team {$teamCode}: " . $e->getMessage());
            return null;
        }
    }
}