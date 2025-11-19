<?php

namespace Database\Seeders;

use App\Models\Championship;
use App\Models\DraftPick;
use App\Models\FantasyLeague;
use App\Models\FantasyTeam;
use App\Models\FantasyTeamPlayer;
use App\Models\Game;
use App\Models\League;
use App\Models\LeagueMember;
use App\Models\Player;
use App\Models\Prediction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🌱 Starting comprehensive database seeding...');

        // Create admin and test users
        $this->command->info('👥 Creating users...');
        $admin = User::firstOrCreate(
            ['email' => 'admin@hoopredict.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'is_admin' => true,
            ]
        );

        $testUser = User::firstOrCreate(
            ['email' => 'test@hoopredict.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
            ]
        );

        // Create 298 additional random users (total 300)
        $users = User::factory(298)->create();
        $allUsers = collect([$admin, $testUser])->merge($users);
        $this->command->info("✅ Created {$allUsers->count()} users");

        // Get championship and verify scraped data exists
        $championship = Championship::first();
        if (! $championship) {
            $this->command->error('❌ No championship found! Run scrapers first.');

            return;
        }

        $players = Player::all();
        if ($players->isEmpty()) {
            $this->command->error('❌ No players found! Run scrapers first.');

            return;
        }

        $games = Game::where('championship_id', $championship->id)
            ->where('status', 'finished')
            ->get();

        $this->command->info("📊 Found {$players->count()} players and {$games->count()} finished games");

        // Create Prediction Leagues
        $this->command->info('🏆 Creating prediction leagues...');

        // Public leagues
        $publicLeague1 = League::create([
            'name' => 'EuroLeague Predictions 2025-26',
            'description' => 'The main public prediction league for all fans',
            'is_private' => false,
            'owner_id' => $admin->id,
            'max_members' => 100,
            'is_active' => true,
        ]);

        $publicLeague2 = League::create([
            'name' => 'Casual Predictors',
            'description' => 'Just for fun predictions, no pressure!',
            'is_private' => false,
            'owner_id' => $users->random()->id,
            'max_members' => 50,
            'is_active' => true,
        ]);

        // Private leagues
        $privateLeague1 = League::create([
            'name' => 'Office League',
            'description' => 'Company predictions league',
            'is_private' => true,
            'owner_id' => $testUser->id,
            'max_members' => 20,
            'is_active' => true,
        ]);

        $privateLeague2 = League::create([
            'name' => 'Friends & Family',
            'description' => 'Close friends predictions',
            'is_private' => true,
            'owner_id' => $users->random()->id,
            'max_members' => 15,
            'is_active' => true,
        ]);

        $leagues = collect([$publicLeague1, $publicLeague2, $privateLeague1, $privateLeague2]);
        $this->command->info("✅ Created {$leagues->count()} prediction leagues");

        // Add members to leagues
        $this->command->info('👥 Adding members to prediction leagues...');
        $totalMembers = 0;

        foreach ($leagues as $league) {
            // Add owner as member
            LeagueMember::create([
                'league_id' => $league->id,
                'user_id' => $league->owner_id,
                'role' => 'owner',
                'joined_at' => now()->subDays(rand(30, 60)),
            ]);
            $totalMembers++;

            // Add random members
            $memberCount = $league->is_private ? rand(5, 12) : rand(15, 30);
            $randomUsers = $allUsers->where('id', '!=', $league->owner_id)->random(min($memberCount, $allUsers->count() - 1));

            foreach ($randomUsers as $user) {
                LeagueMember::create([
                    'league_id' => $league->id,
                    'user_id' => $user->id,
                    'role' => 'member',
                    'joined_at' => now()->subDays(rand(1, 30)),
                ]);
                $totalMembers++;
            }
        }

        $this->command->info("✅ Added {$totalMembers} league members");

        // Create predictions for finished games - EVERY member predicts EVERY game
        $this->command->info('🎯 Creating predictions...');
        $totalPredictions = 0;

        foreach ($leagues as $league) {
            $members = $league->members;

            // Every member predicts every finished game
            foreach ($games as $game) {
                foreach ($members as $member) {
                    // Generate realistic predictions around actual scores with variance
                    $homeVariance = rand(-15, 15);
                    $awayVariance = rand(-15, 15);

                    $prediction = Prediction::create([
                        'user_id' => $member->user_id,
                        'league_id' => $league->id,
                        'game_id' => $game->id,
                        'home_score_prediction' => max(50, $game->home_score + $homeVariance),
                        'away_score_prediction' => max(50, $game->away_score + $awayVariance),
                        'predicted_at' => $game->scheduled_at->subHours(rand(1, 48)),
                    ]);

                    // Calculate points
                    $points = $prediction->calculatePoints();
                    $prediction->update(['points_earned' => $points]);
                    $totalPredictions++;
                }
            }
        }

        $this->command->info("✅ Created {$totalPredictions} predictions (all members predicted all games)");

        // Create Fantasy Leagues - Budget Mode (Marketplace)
        $this->command->info('💰 Creating budget fantasy leagues...');

        $budgetLeague1 = FantasyLeague::create([
            'name' => 'Budget Genius Challenge',
            'description' => 'Test your skills with limited budget',
            'owner_id' => $admin->id,
            'championship_id' => $championship->id,
            'mode' => 'budget',
            'budget' => 10000000, // €10M
            'team_size' => 10,
            'invite_code' => $this->generateInviteCode(),
            'is_private' => false,
            'max_members' => 20,
            'is_active' => true,
        ]);

        $budgetLeague2 = FantasyLeague::create([
            'name' => 'Balanced Ballers League',
            'description' => 'Default budget, maximum fun',
            'owner_id' => $users->random()->id,
            'championship_id' => $championship->id,
            'mode' => 'budget',
            'budget' => 17500000, // €17.5M
            'team_size' => 10,
            'invite_code' => $this->generateInviteCode(),
            'is_private' => false,
            'max_members' => 25,
            'is_active' => true,
        ]);

        $budgetLeague3 = FantasyLeague::create([
            'name' => 'Rich Dad Fantasy',
            'description' => 'Big budget, big dreams',
            'owner_id' => $testUser->id,
            'championship_id' => $championship->id,
            'mode' => 'budget',
            'budget' => 25000000, // €25M
            'team_size' => 10,
            'invite_code' => $this->generateInviteCode(),
            'is_private' => true,
            'max_members' => 15,
            'is_active' => true,
        ]);

        $budgetLeagues = collect([$budgetLeague1, $budgetLeague2, $budgetLeague3]);
        $this->command->info("✅ Created {$budgetLeagues->count()} budget fantasy leagues");

        // Create Fantasy Leagues - Draft Mode
        $this->command->info('🎲 Creating draft fantasy leagues...');

        $draftLeague1 = FantasyLeague::create([
            'name' => 'Elite Draft League',
            'description' => 'Snake draft competition for the best managers',
            'owner_id' => $admin->id,
            'championship_id' => $championship->id,
            'mode' => 'draft',
            'team_size' => 10,
            'invite_code' => $this->generateInviteCode(),
            'is_private' => false,
            'max_members' => 12,
            'draft_status' => 'pending',
            'draft_date' => now()->addDays(7),
            'pick_time_limit' => 60,
            'is_active' => true,
        ]);

        $draftLeague2 = FantasyLeague::create([
            'name' => 'Quick Draft Express',
            'description' => 'Fast-paced 30-second pick draft',
            'owner_id' => $users->random()->id,
            'championship_id' => $championship->id,
            'mode' => 'draft',
            'team_size' => 10,
            'invite_code' => $this->generateInviteCode(),
            'is_private' => false,
            'max_members' => 8,
            'draft_status' => 'pending',
            'draft_date' => now()->addDays(3),
            'pick_time_limit' => 30,
            'is_active' => true,
        ]);

        // Completed draft league
        $draftLeague3 = FantasyLeague::create([
            'name' => 'Season Starter Draft',
            'description' => 'Draft completed, season in progress',
            'owner_id' => $testUser->id,
            'championship_id' => $championship->id,
            'mode' => 'draft',
            'team_size' => 10,
            'invite_code' => $this->generateInviteCode(),
            'is_private' => true,
            'max_members' => 10,
            'draft_status' => 'completed',
            'draft_date' => now()->subDays(10),
            'pick_time_limit' => 45,
            'is_active' => true,
        ]);

        $draftLeagues = collect([$draftLeague1, $draftLeague2, $draftLeague3]);
        $this->command->info("✅ Created {$draftLeagues->count()} draft fantasy leagues");

        // Create fantasy teams for budget leagues
        $this->command->info('👕 Creating fantasy teams for budget leagues...');
        $totalBudgetTeams = 0;

        foreach ($budgetLeagues as $league) {
            // Owner team
            $ownerTeam = FantasyTeam::create([
                'fantasy_league_id' => $league->id,
                'user_id' => $league->owner_id,
                'team_name' => $league->owner->name."'s Squad",
                'lineup_type' => '2-2-1',
                'budget_spent' => 0,
                'budget_remaining' => $league->budget,
                'total_points' => 0,
            ]);
            $totalBudgetTeams++;

            // Random teams
            $teamCount = rand(8, $league->max_members - 1);
            $randomUsers = $allUsers->where('id', '!=', $league->owner_id)->random(min($teamCount, $allUsers->count() - 1));

            foreach ($randomUsers as $user) {
                $team = FantasyTeam::create([
                    'fantasy_league_id' => $league->id,
                    'user_id' => $user->id,
                    'team_name' => $this->generateTeamName(),
                    'lineup_type' => collect(['2-2-1', '2-1-2', '3-1-1'])->random(),
                    'budget_spent' => 0,
                    'budget_remaining' => $league->budget,
                    'total_points' => 0,
                ]);
                $totalBudgetTeams++;

                // Add players to team
                $this->addPlayersToTeam($team, $players, $league->budget);
            }

            // Add players to owner team too
            $this->addPlayersToTeam($ownerTeam, $players, $league->budget);
        }

        $this->command->info("✅ Created {$totalBudgetTeams} budget fantasy teams");

        // Create fantasy teams for draft leagues
        $this->command->info('🎲 Creating fantasy teams for draft leagues...');
        $totalDraftTeams = 0;

        foreach ($draftLeagues as $league) {
            // Owner team
            $ownerTeam = FantasyTeam::create([
                'fantasy_league_id' => $league->id,
                'user_id' => $league->owner_id,
                'team_name' => $league->owner->name."'s Draft Picks",
                'lineup_type' => '2-2-1',
                'draft_order' => 1,
                'budget_spent' => 0,
                'budget_remaining' => 0,
                'total_points' => 0,
            ]);
            $totalDraftTeams++;

            // Random teams
            $teamCount = rand(6, $league->max_members - 1);
            $randomUsers = $allUsers->where('id', '!=', $league->owner_id)->random(min($teamCount, $allUsers->count() - 1));

            $order = 2;
            foreach ($randomUsers as $user) {
                $team = FantasyTeam::create([
                    'fantasy_league_id' => $league->id,
                    'user_id' => $user->id,
                    'team_name' => $this->generateTeamName(),
                    'lineup_type' => collect(['2-2-1', '2-1-2', '3-1-1'])->random(),
                    'draft_order' => $order++,
                    'budget_spent' => 0,
                    'budget_remaining' => 0,
                    'total_points' => 0,
                ]);
                $totalDraftTeams++;
            }

            // If draft is completed, simulate the draft
            if ($league->draft_status === 'completed') {
                $this->simulateDraft($league, $players);
            }
        }

        $this->command->info("✅ Created {$totalDraftTeams} draft fantasy teams");

        // Create historical lineup snapshots for finished rounds
        $this->command->info('📸 Creating historical lineup snapshots...');
        $this->createLineupSnapshots($championship);

        $this->command->info('');
        $this->command->info('🎉 Seeding completed successfully!');
        $this->command->info('');
        $this->command->info('📊 Summary:');
        $this->command->info("   Users: {$allUsers->count()}");
        $this->command->info("   Prediction Leagues: {$leagues->count()}");
        $this->command->info("   League Members: {$totalMembers}");
        $this->command->info("   Predictions: {$totalPredictions}");
        $this->command->info("   Budget Fantasy Leagues: {$budgetLeagues->count()}");
        $this->command->info("   Draft Fantasy Leagues: {$draftLeagues->count()}");
        $this->command->info("   Budget Teams: {$totalBudgetTeams}");
        $this->command->info("   Draft Teams: {$totalDraftTeams}");
        $this->command->info('');
        $this->command->info('🔐 Login credentials:');
        $this->command->info('   Admin: admin@hoopredict.com / password');
        $this->command->info('   Test User: test@example.com / password');
    }

    /**
     * Generate secure invite code (6 characters for fantasy leagues)
     */
    private function generateInviteCode(): string
    {
        return strtoupper(substr(str_replace(['/', '+', '='], '', base64_encode(random_bytes(6))), 0, 6));
    }

    /**
     * Generate random team name
     */
    private function generateTeamName(): string
    {
        $adjectives = [
            'Thunder', 'Lightning', 'Storm', 'Blaze', 'Phoenix', 'Dragons',
            'Wolves', 'Hawks', 'Eagles', 'Lions', 'Tigers', 'Panthers',
            'Knights', 'Warriors', 'Champions', 'Legends', 'Dynasty', 'Empire',
        ];

        $nouns = [
            'Ballers', 'Dunkers', 'Shooters', 'Slammers', 'Dribblers',
            'Squad', 'Crew', 'Team', 'Force', 'United', 'Athletic',
            'Hoops', 'Court', 'Buckets', 'Rim', 'Net',
        ];

        return $adjectives[array_rand($adjectives)].' '.$nouns[array_rand($nouns)];
    }

    /**
     * Add players to a budget team - ALWAYS adds exactly 10 players
     */
    private function addPlayersToTeam(FantasyTeam $team, $allPlayers, $budget): void
    {
        $selectedPlayers = collect();
        $totalSpent = 0;

        // Filter players with valid prices and sort by price
        $availablePlayers = $allPlayers
            ->filter(fn ($p) => $p->price !== null && $p->price > 0)
            ->sortBy('price');

        // Position requirements
        $positionsNeeded = [
            'Guard' => 3,
            'Forward' => 3,
            'Center' => 2,
        ];

        // First pass: Fill minimum position requirements with affordable players
        foreach ($positionsNeeded as $position => $minCount) {
            $positionPlayers = $availablePlayers
                ->where('position', $position)
                ->whereNotIn('id', $selectedPlayers->pluck('id'))
                ->filter(fn ($p) => $totalSpent + $p->price <= $budget);

            $toSelect = min($minCount, $positionPlayers->count());
            $selected = $positionPlayers->take($toSelect * 2)->random($toSelect);

            foreach ($selected as $player) {
                $selectedPlayers->push($player);
                $totalSpent += $player->price;
            }
        }

        // Second pass: Fill remaining slots (up to 10 total) with any affordable players
        $remaining = 10 - $selectedPlayers->count();
        if ($remaining > 0) {
            $remainingPlayers = $availablePlayers
                ->whereNotIn('id', $selectedPlayers->pluck('id'))
                ->filter(fn ($p) => $totalSpent + $p->price <= $budget)
                ->values();

            // If not enough affordable players, pick cheapest ones
            if ($remainingPlayers->count() < $remaining) {
                $cheapest = $availablePlayers
                    ->whereNotIn('id', $selectedPlayers->pluck('id'))
                    ->sortBy('price')
                    ->take($remaining)
                    ->values();

                foreach ($cheapest as $player) {
                    $selectedPlayers->push($player);
                    $totalSpent += $player->price;
                }
            } else {
                // Pick random affordable players
                $selected = $remainingPlayers->random($remaining);
                foreach ($selected as $player) {
                    $selectedPlayers->push($player);
                    $totalSpent += $player->price;
                }
            }
        }

        // Safety check: If still not 10 players, fill with cheapest available
        if ($selectedPlayers->count() < 10) {
            $needed = 10 - $selectedPlayers->count();
            $cheapest = $availablePlayers
                ->whereNotIn('id', $selectedPlayers->pluck('id'))
                ->sortBy('price')
                ->take($needed);

            foreach ($cheapest as $player) {
                $selectedPlayers->push($player);
                $totalSpent += $player->price;
            }
        }

        // Attach exactly 10 players to team with lineup positions
        // Assign positions based on player position to match formation requirements
        $guards = $selectedPlayers->where('position', 'Guard')->values();
        $forwards = $selectedPlayers->where('position', 'Forward')->values();
        $centers = $selectedPlayers->where('position', 'Center')->values();

        $lineupPosition = 1;
        $captainAssigned = false;
        $orderedPlayers = collect();

        // Starting lineup (positions 1-5) based on team's formation
        $formationRequirements = match ($team->lineup_type) {
            '2-2-1' => ['Guard' => 2, 'Forward' => 2, 'Center' => 1],
            '3-1-1' => ['Guard' => 3, 'Forward' => 1, 'Center' => 1],
            '1-3-1' => ['Guard' => 1, 'Forward' => 3, 'Center' => 1],
            '1-2-2' => ['Guard' => 1, 'Forward' => 2, 'Center' => 2],
            '2-1-2' => ['Guard' => 2, 'Forward' => 1, 'Center' => 2],
            default => ['Guard' => 2, 'Forward' => 2, 'Center' => 1], // Fallback to 2-2-1
        };

        // Fill starting positions based on formation
        for ($i = 0; $i < $formationRequirements['Guard'] && $guards->count() > 0; $i++) {
            $orderedPlayers->push($guards->shift());
        }
        for ($i = 0; $i < $formationRequirements['Forward'] && $forwards->count() > 0; $i++) {
            $orderedPlayers->push($forwards->shift());
        }
        for ($i = 0; $i < $formationRequirements['Center'] && $centers->count() > 0; $i++) {
            $orderedPlayers->push($centers->shift());
        }

        // Position 6: Sixth man (any remaining player)
        $remaining = $guards->merge($forwards)->merge($centers)->shuffle();
        if ($remaining->count() > 0) {
            $orderedPlayers->push($remaining->shift());
        }

        // Positions 7-10: Bench (remaining players)
        while ($orderedPlayers->count() < 10 && $remaining->count() > 0) {
            $orderedPlayers->push($remaining->shift());
        }

        // Create player records with proper lineup positions
        foreach ($orderedPlayers->take(10) as $player) {
            // First player (first guard) becomes captain
            $isCaptain = $lineupPosition === 1 && ! $captainAssigned;
            if ($isCaptain) {
                $captainAssigned = true;
            }

            FantasyTeamPlayer::create([
                'fantasy_team_id' => $team->id,
                'player_id' => $player->id,
                'purchase_price' => $player->price,
                'acquired_at' => now()->subDays(rand(1, 15)),
                'lineup_position' => $lineupPosition++,
                'is_captain' => $isCaptain,
            ]);
        }

        // Update team budget
        $team->update([
            'budget_spent' => $totalSpent,
            'budget_remaining' => $budget - $totalSpent,
        ]);
    }

    /**
     * Simulate a completed draft
     */
    private function simulateDraft(FantasyLeague $league, $allPlayers): void
    {
        $teams = $league->teams()->orderBy('draft_order')->get();
        $availablePlayers = $allPlayers->shuffle();
        $pickNumber = 1;

        for ($round = 1; $round <= $league->team_size; $round++) {
            $teamsInOrder = $round % 2 === 0 ? $teams->reverse() : $teams; // Snake draft

            foreach ($teamsInOrder as $team) {
                if ($availablePlayers->isEmpty()) {
                    break;
                }

                $player = $availablePlayers->shift();

                // Create draft pick
                DraftPick::create([
                    'fantasy_league_id' => $league->id,
                    'fantasy_team_id' => $team->id,
                    'player_id' => $player->id,
                    'pick_number' => $pickNumber,
                    'round' => $round,
                    'created_at' => now()->subDays(10)->addMinutes($pickNumber),
                ]);

                // Add player to team with lineup position based on draft round
                // First player drafted (round 1) becomes captain
                FantasyTeamPlayer::create([
                    'fantasy_team_id' => $team->id,
                    'player_id' => $player->id,
                    'purchase_price' => 0,
                    'acquired_at' => now()->subDays(10)->addMinutes($pickNumber),
                    'lineup_position' => $round, // Round 1-10 becomes position 1-10
                    'is_captain' => $round === 1, // First pick becomes captain
                ]);

                $pickNumber++;
            }
        }
    }

    /**
     * Create historical lineup snapshots for all finished rounds (for testing)
     * NOTE: In production, snapshots are created automatically when rounds lock via hourly scheduler
     */
    private function createLineupSnapshots(Championship $championship): void
    {
        // Get all finished rounds for this championship
        $finishedRounds = Game::where('championship_id', $championship->id)
            ->where('status', 'finished')
            ->distinct()
            ->pluck('round')
            ->sort()
            ->values();

        if ($finishedRounds->isEmpty()) {
            $this->command->warn('  No finished rounds found to snapshot');

            return;
        }

        $totalSnapshots = 0;

        // Get all fantasy leagues for this championship
        $fantasyLeagues = FantasyLeague::where('championship_id', $championship->id)->get();

        $formations = ['2-2-1', '3-1-1', '1-3-1', '1-2-2', '2-1-2'];

        foreach ($finishedRounds as $round) {
            foreach ($fantasyLeagues as $league) {
                // Get all teams in this league
                $teams = FantasyTeam::where('fantasy_league_id', $league->id)->get();

                foreach ($teams as $team) {
                    // 80% chance to keep same formation, 20% chance to change (more realistic)
                    $lineupType = rand(1, 100) <= 80 ? $team->lineup_type : collect($formations)->random();

                    // Snapshot current lineup for this team at this round
                    // NOTE: In real scenario, this would be the lineup when round locked
                    $teamPlayers = $team->fantasyTeamPlayers;

                    foreach ($teamPlayers as $teamPlayer) {
                        \App\Models\FantasyTeamLineupHistory::create([
                            'fantasy_team_id' => $team->id,
                            'round' => $round,
                            'lineup_type' => $lineupType, // Save formation for this round (may vary)
                            'fantasy_team_player_id' => $teamPlayer->id,
                            'lineup_position' => $teamPlayer->lineup_position,
                            'is_captain' => $teamPlayer->is_captain,
                        ]);
                        $totalSnapshots++;
                    }
                }
            }

            // Mark round as snapshotted in round_processing_status
            \App\Models\RoundProcessingStatus::where('championship_id', $championship->id)
                ->where('round_number', $round)
                ->update([
                    'lineups_snapshotted' => true,
                    'lineups_snapshotted_at' => now()->subDays(rand(1, 10)), // Simulate past snapshot
                ]);
        }

        $this->command->info("✅ Created {$totalSnapshots} lineup snapshots for ".$finishedRounds->count().' finished rounds');
    }
}
