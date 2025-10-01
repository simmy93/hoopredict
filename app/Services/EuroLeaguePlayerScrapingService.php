<?php

namespace App\Services;

use App\Models\Championship;
use App\Models\Player;
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

    public function scrapePlayers(): void
    {
        try {
            Log::info('Starting EuroLeague players scraping from API');

            $response = $this->client->get('https://feeds.incrowdsports.com/provider/euroleague-feeds/v2/competitions/E/seasons/E2025/people');
            $playersData = json_decode($response->getBody()->getContents(), true);

            if (!isset($playersData['data'])) {
                throw new \Exception('Invalid response structure from players API');
            }

            $euroLeague = $this->getOrCreateChampionship();
            $processedCount = 0;

            foreach ($playersData['data'] as $playerData) {
                // Skip if not a player (some might be coaches, etc.)
                if (!isset($playerData['type']) || $playerData['type'] !== 'J') {
                    continue;
                }

                // Get person data
                $person = $playerData['person'] ?? null;
                if (!$person || !isset($person['code'])) {
                    continue;
                }

                // Skip if no club assigned
                if (!isset($playerData['club']['code'])) {
                    continue;
                }

                // Find the team
                $team = Team::where('championship_id', $euroLeague->id)
                    ->where('external_id', $playerData['club']['code'])
                    ->first();

                if (!$team) {
                    Log::warning("Team not found for player: {$person['name']} (Team code: {$playerData['club']['code']})");
                    continue;
                }

                // Download player photo if available, otherwise use placeholder
                $photoUrl = null;
                if (isset($playerData['images']['headshot']) && !empty($playerData['images']['headshot'])) {
                    Log::info("Attempting to download photo for {$person['name']}: {$playerData['images']['headshot']}");
                    $photoUrl = $this->downloadPlayerPhoto($playerData['images']['headshot'], $person['code']);
                    if ($photoUrl) {
                        Log::info("Successfully downloaded photo for {$person['name']}");
                    }
                }

                // If download failed or no image, use placeholder
                if (!$photoUrl) {
                    $position = $this->mapPositionCode($playerData['position'] ?? null);
                    $photoUrl = $this->getPlaceholderAvatar($position, $person['name']);
                }

                // Map position code to name
                $position = $this->mapPositionCode($playerData['position'] ?? null);

                // Calculate initial price based on position (simplified for now)
                $initialPrice = $this->calculateInitialPrice($position);

                Player::updateOrCreate(
                    [
                        'external_id' => $person['code']
                    ],
                    [
                        'name' => $person['name'],
                        'position' => $position,
                        'jersey_number' => $playerData['dorsal'] ?? null,
                        'team_id' => $team->id,
                        'photo_url' => $photoUrl,
                        'country' => $person['country']['name'] ?? null,
                        'price' => $initialPrice,
                        'is_active' => $playerData['active'] ?? true,
                    ]
                );

                $processedCount++;
                Log::info("Scraped player: {$person['name']} ({$position}) - {$team->name}");
            }

            Log::info("EuroLeague players scraping completed successfully. Processed {$processedCount} players.");
        } catch (RequestException $e) {
            Log::error('HTTP error scraping EuroLeague players: ' . $e->getMessage());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error scraping EuroLeague players: ' . $e->getMessage());
            throw $e;
        }
    }

    private function mapPositionCode(?int $positionCode): string
    {
        // EuroLeague API position codes:
        // 1 = Guard
        // 2 = Forward
        // 3 = Center
        return match($positionCode) {
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
        return match($position) {
            'Guard' => 5000000,   // 5M
            'Center' => 5500000,  // 5.5M
            'Forward' => 4500000, // 4.5M
            default => 3000000,   // 3M default
        };
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
            $filename = 'player-photos/' . strtolower($playerCode) . '.' . $extension;

            // Save to public storage
            Storage::disk('public')->put($filename, $imageContent);

            // Return the public URL path
            return '/storage/' . $filename;
        } catch (\Exception $e) {
            Log::warning("Failed to download photo for player {$playerCode}: " . $e->getMessage());
            return null;
        }
    }

    private function getPlaceholderAvatar(string $position, string $playerName = ''): string
    {
        // Use player name if available, otherwise position
        $name = !empty($playerName) ? $playerName : $position;

        // Color based on position
        $colors = [
            'Guard' => '4F46E5',    // Indigo
            'Forward' => 'F59E0B',  // Amber
            'Center' => 'EF4444',   // Red
        ];

        $color = $colors[$position] ?? '6B7280'; // Gray default

        return "https://ui-avatars.com/api/?name=" . urlencode($name) . "&size=200&background=" . $color . "&color=fff";
    }
}
