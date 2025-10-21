<?php

namespace App\Services;

use App\Models\Championship;
use App\Models\Game;
use App\Models\Player;
use App\Models\PlayerGameStat;
use App\Models\Team;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class EuroLeaguePlayerScrapingService
{
    private Client $client;

    private ?Championship $euroLeague = null;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 30,
            'verify' => false, // Disable SSL verification for development
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ],
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
                    'external_id' => 'euroleague-2025',
                ]
            );
        }

        return $this->euroLeague;
    }

    public function scrapePlayers(): void
    {
        try {
            Log::info('Starting EuroLeague players scraping from API');

            $response = $this->client->get('https://feeds.incrowdsports.com/provider/euroleague-feeds/v2/competitions/E/seasons/E2025/people');
            $playersData = json_decode($response->getBody()->getContents(), true);

            if (! isset($playersData['data'])) {
                throw new \Exception('Invalid response structure from players API');
            }

            $euroLeague = $this->getOrCreateChampionship();
            $processedCount = 0;

            foreach ($playersData['data'] as $playerData) {
                // Skip if not a player (some might be coaches, etc.)
                if (! isset($playerData['type']) || $playerData['type'] !== 'J') {
                    continue;
                }

                // Get person data
                $person = $playerData['person'] ?? null;
                if (! $person || ! isset($person['code'])) {
                    continue;
                }

                // Skip if no club assigned
                if (! isset($playerData['club']['code'])) {
                    continue;
                }

                // Find the team
                $team = Team::where('championship_id', $euroLeague->id)
                    ->where('external_id', $playerData['club']['code'])
                    ->first();

                if (! $team) {
                    Log::warning("Team not found for player: {$person['name']} (Team code: {$playerData['club']['code']})");

                    continue;
                }

                // Download player photo if available, otherwise use placeholder
                $photoUrl = null;
                if (isset($playerData['images']['headshot']) && ! empty($playerData['images']['headshot'])) {
                    Log::info("Attempting to download photo for {$person['name']}: {$playerData['images']['headshot']}");
                    $photoUrl = $this->downloadPlayerPhoto($playerData['images']['headshot'], $person['code']);
                    if ($photoUrl) {
                        Log::info("Successfully downloaded photo for {$person['name']}");
                    }
                }

                // If download failed or no image, use placeholder
                if (! $photoUrl) {
                    $position = $this->mapPositionCode($playerData['position'] ?? null);
                    $photoUrl = $this->getPlaceholderAvatar($position, $person['name']);
                }

                // Map position code to name
                $position = $this->mapPositionCode($playerData['position'] ?? null);

                // Check if player already exists to preserve manually set prices
                $existingPlayer = Player::where('external_id', $person['code'])->first();

                // Determine if player should be active and have a price
                // New players without stats will be inactive and have no price until admin sets it manually
                $isActive = $existingPlayer ? $existingPlayer->is_active : false;
                $price = $existingPlayer ? $existingPlayer->price : null;

                Player::updateOrCreate(
                    [
                        'external_id' => $person['code'],
                    ],
                    [
                        'name' => $person['name'],
                        'position' => $position,
                        'jersey_number' => $playerData['dorsal'] ?? null,
                        'team_id' => $team->id,
                        'photo_url' => $photoUrl,
                        'country' => $person['country']['name'] ?? null,
                        'price' => $price,
                        'is_active' => $isActive,
                    ]
                );

                $processedCount++;
                Log::info("Scraped player: {$person['name']} ({$position}) - {$team->name}");
            }

            Log::info("EuroLeague players scraping completed successfully. Processed {$processedCount} players.");
        } catch (RequestException $e) {
            Log::error('HTTP error scraping EuroLeague players: '.$e->getMessage());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error scraping EuroLeague players: '.$e->getMessage());
            throw $e;
        }
    }

    private function mapPositionCode(?int $positionCode): string
    {
        // EuroLeague API position codes:
        // 1 = Guard
        // 2 = Forward
        // 3 = Center
        return match ($positionCode) {
            1 => 'Guard',
            2 => 'Forward',
            3 => 'Center',
            default => 'Forward', // Default if unknown
        };
    }

    private function calculateInitialPrice(string $position): float
    {
        // Initial prices based on position
        // Guards and Centers typically more valuable
        return match ($position) {
            'Guard' => 5000000,   // 5M
            'Center' => 5500000,  // 5.5M
            'Forward' => 4500000, // 4.5M
            default => 3000000,   // 3M default
        };
    }

    private function activatePlayerWithStats(Player $player): void
    {
        // If player was inactive and has no price, set initial price and activate
        if (! $player->is_active && $player->price === null) {
            $player->price = $this->calculateInitialPrice($player->position);
            $player->is_active = true;
            $player->save();
            Log::info("Activated player {$player->name} with initial price: ".($player->price / 1000000).'M');
        }
    }

    private function downloadPlayerPhoto(string $photoUrl, string $playerCode): ?string
    {
        try {
            // Download the image
            $response = $this->client->get($photoUrl);
            $imageContent = $response->getBody()->getContents();

            // Get file extension from URL
            $extension = pathinfo(parse_url($photoUrl, PHP_URL_PATH), PATHINFO_EXTENSION);
            if (empty($extension)) {
                $extension = 'png'; // Default to png
            }

            // Create filename
            $filename = 'player-photos/'.strtolower($playerCode).'.'.$extension;

            // Save to public storage
            Storage::disk('public')->put($filename, $imageContent);

            // Return the public URL path
            return '/storage/'.$filename;
        } catch (\Exception $e) {
            Log::warning("Failed to download photo for player {$playerCode}: ".$e->getMessage());

            return null;
        }
    }

    private function getPlaceholderAvatar(string $position, string $playerName = ''): string
    {
        // Use player name if available, otherwise position
        $name = ! empty($playerName) ? $playerName : $position;

        // Color based on position
        $colors = [
            'Guard' => '4F46E5',    // Indigo
            'Forward' => 'F59E0B',  // Amber
            'Center' => 'EF4444',   // Red
        ];

        $color = $colors[$position] ?? '6B7280'; // Gray default

        return 'https://ui-avatars.com/api/?name='.urlencode($name).'&size=200&background='.$color.'&color=fff';
    }

    public function scrapePlayerStats(): void
    {
        try {
            Log::info('Starting EuroLeague player statistics scraping');

            $euroLeague = $this->getOrCreateChampionship();

            // Get all finished games that need stats
            $games = Game::where('championship_id', $euroLeague->id)
                ->where('status', 'finished')
                ->whereNotNull('home_score')
                ->whereNotNull('away_score')
                ->orderBy('date', 'desc')
                ->get();

            if ($games->isEmpty()) {
                Log::info('No finished games found to scrape stats for');

                return;
            }

            $totalStats = 0;
            $gamesProcessed = 0;

            foreach ($games as $game) {
                try {
                    Log::info("Scraping stats for game #{$game->external_id}: {$game->homeTeam->name} vs {$game->awayTeam->name}");

                    $url = "https://feeds.incrowdsports.com/provider/euroleague-feeds/v2/competitions/E/seasons/E2025/games/{$game->code}";
                    $response = $this->client->get($url);
                    $data = json_decode($response->getBody()->getContents(), true);

                    if (! isset($data['data'])) {
                        Log::warning("No game data for game #{$game->external_id}");

                        continue;
                    }

                    $gameData = $data['data'];

                    // Process both home and away teams
                    foreach (['home', 'away'] as $side) {
                        if (! isset($gameData[$side]['players'])) {
                            continue;
                        }

                        foreach ($gameData[$side]['players'] as $playerData) {
                            // Skip if player didn't play or has no stats
                            if (! isset($playerData['code']) || ! isset($playerData['stats'])) {
                                continue;
                            }

                            // Find the player in our database
                            $player = Player::where('external_id', $playerData['code'])->first();

                            if (! $player) {
                                Log::warning("Player not found: {$playerData['code']}");

                                continue;
                            }

                            $stats = $playerData['stats'];

                            // Parse minutes from seconds (API stores in seconds, not milliseconds)
                            $minutesPlayed = 0;
                            if (isset($stats['timePlayed']) && $stats['timePlayed'] > 0) {
                                $minutesPlayed = round($stats['timePlayed'] / 60, 2); // Convert seconds to minutes
                            }

                            // Skip players who didn't play
                            if ($minutesPlayed == 0) {
                                continue;
                            }

                            // Create or update player game stats
                            $playerStat = PlayerGameStat::updateOrCreate(
                                [
                                    'player_id' => $player->id,
                                    'game_id' => $game->id,
                                ],
                                [
                                    'minutes_played' => $minutesPlayed,
                                    'points' => $stats['points'] ?? 0,
                                    'rebounds' => $stats['totalRebounds'] ?? 0,
                                    'assists' => $stats['assists'] ?? 0,
                                    'steals' => $stats['steals'] ?? 0,
                                    'blocks' => $stats['blocksFavour'] ?? 0,
                                    'turnovers' => $stats['turnovers'] ?? 0,
                                ]
                            );

                            // Calculate and save fantasy points
                            $playerStat->updateFantasyPoints();

                            // Activate player if they now have stats
                            $this->activatePlayerWithStats($player);

                            $totalStats++;
                        }
                    }

                    $gamesProcessed++;

                    // Rate limiting - sleep for 100ms between games
                    usleep(100000);

                } catch (RequestException $e) {
                    if ($e->getResponse() && $e->getResponse()->getStatusCode() === 404) {
                        Log::warning("Boxscore not found for game #{$game->external_id}");
                    } else {
                        Log::error("HTTP error scraping stats for game #{$game->external_id}: ".$e->getMessage());
                    }

                    continue;
                } catch (\Exception $e) {
                    Log::error("Error scraping stats for game #{$game->external_id}: ".$e->getMessage());

                    continue;
                }
            }

            Log::info("Player statistics scraping completed. Processed {$gamesProcessed} games with {$totalStats} player stats.");

            // Update player prices based on recent performance
            $this->updatePlayerPrices();

        } catch (\Exception $e) {
            Log::error('Error scraping player statistics: '.$e->getMessage());
            throw $e;
        }
    }

    private function updatePlayerPrices(): void
    {
        try {
            Log::info('Updating player prices based on performance');

            $players = Player::where('is_active', true)->get();
            $updatedCount = 0;

            foreach ($players as $player) {
                $player->updatePriceBasedOnPerformance();
                $updatedCount++;
            }

            Log::info("Updated prices for {$updatedCount} players");
        } catch (\Exception $e) {
            Log::error('Error updating player prices: '.$e->getMessage());
        }
    }
}
