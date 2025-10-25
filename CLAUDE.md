# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HooPredict is a Laravel 12 + React (Inertia.js) application for basketball predictions and fantasy leagues, focused on EuroLeague competition. The application supports two main features:

1. **Prediction Leagues**: Users predict game outcomes and compete on leaderboards
2. **Fantasy Leagues**: Users draft real EuroLeague players and manage fantasy teams with two modes:
   - **Draft Mode**: Snake draft system with real-time websockets and auto-pick functionality
   - **Marketplace Mode**: Buy/sell players with dynamic pricing based on performance

## Common Commands

### Initial Setup (Complete Database with Test Data)
```bash
# Complete fresh setup with scraped data and seeded test data
php artisan migrate:fresh && \
php artisan scrape:euroleague --teams && \
php artisan scrape:euroleague --players && \
php artisan scrape:euroleague --games && \
php artisan scrape:euroleague --stats && \
php artisan rounds:process-prices --all && \
php artisan fantasy:calculate-team-points --round=1 && \
php artisan db:seed

# This gives you:
# - 18 EuroLeague teams with logos
# - ~330 active players with current prices
# - All historical games (typically 60+ finished games from recent rounds)
# - Player price histories for all processed rounds
# - 30 test users (1 admin, 1 test user, 28 random)
# - 4 prediction leagues with realistic predictions
# - 6 fantasy leagues (3 budget mode, 3 draft mode)
# - 1 completed draft league with simulated snake draft
```

### Development
```bash
# Start full dev environment (server, queue, logs, vite)
composer dev

# Start dev with SSR support
composer dev:ssr

# Run tests
composer test
# OR
php artisan test

# Run specific test
php artisan test --filter=TestName

# Run queue worker (required for draft auto-pick)
php artisan queue:listen --tries=1

# Run Laravel Pail for real-time logs
php artisan pail --timeout=0

# Run migrations
php artisan migrate

# Create new migration
php artisan make:migration migration_name

# SMART SCRAPER (Recommended for production - runs automatically hourly)
# Updates recent rounds → player stats → processes prices → calculates team points → calculates prediction scores (all in one)
php artisan scrape:recent

# Manual scraping (for initial setup or debugging)
php artisan scrape:euroleague --teams       # Only scrape teams
php artisan scrape:euroleague --games       # Scrape all games (ALL HISTORY by default)
php artisan scrape:euroleague --players     # Only scrape players
php artisan scrape:euroleague --stats       # Only scrape player statistics

# Limit to recent games only (last 7 days) - useful for quick updates
php artisan scrape:euroleague --games --recent-games

# Process round prices manually
php artisan rounds:process-prices           # Auto-detects next unprocessed round
php artisan rounds:process-prices --all     # Process all unprocessed rounds (for initial setup)
php artisan rounds:process-prices --round=5 # Process specific round
php artisan rounds:process-prices --round=3 --force # Reprocess already processed round

# Calculate fantasy team points manually
php artisan fantasy:calculate-team-points   # Auto-detects latest finished round
php artisan fantasy:calculate-team-points --round=5 # Calculate for specific round

# Calculate prediction league scores manually
php artisan predictions:calculate-scores    # Calculate for all leagues
php artisan predictions:calculate-scores --league=1 # Calculate for specific league only
php artisan predictions:calculate-scores --force # Recalculate all (default: only unscored)
```

### Frontend
```bash
# Build frontend assets
npm run build

# Build with SSR
npm run build:ssr

# Run dev server (started by composer dev)
npm run dev

# Type checking
npm run types

# Lint
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

### Code Quality
```bash
# Format PHP code with Laravel Pint
./vendor/bin/pint

# Run PHPUnit tests
./vendor/bin/phpunit
```

## Architecture

### Backend Structure

**Models & Relationships**:
- `League` (Prediction leagues) - has many `LeagueMembers`, `Predictions`, `LeagueLeaderboards`
- `FantasyLeague` - has many `FantasyTeams`, `DraftPicks`; belongs to `Championship`
  - **Budget Modes**: Three preset difficulty levels
    - 🧠 **Budget Genius** (€10M) - "Big brain, small wallet"
    - ⚖️ **Balanced Baller** (€17.5M) - "Working hard, playing smart" (Default)
    - 💎 **Rich Dad Mode** (€25M) - "Buy everyone, ask questions later"
- `FantasyTeam` - belongs to `User` and `FantasyLeague`; has many `FantasyTeamPlayers` through `Player`
- `Player` - belongs to `Team`; has many `PlayerGameStat`, `FantasyTeamPlayers`, `DraftPicks`
- `Championship` - has many `Teams`, `Games`, `FantasyLeagues`
- `Team` - belongs to `Championship`; has many `Players`, `Games` (home/away)
- `Game` - belongs to `Championship`; has `home_team_id` and `away_team_id` relationships

**Key Services**:
- `EuroLeagueScrapingService`: Scrapes teams, games, and schedules from EuroLeague API (https://feeds.incrowdsports.com/provider/euroleague-feeds/v2/)
- `EuroLeaguePlayerScrapingService`: Scrapes player data and stats

**Draft System**:
- Snake draft algorithm in `FantasyLeague::getCurrentDraftTeam()` - even rounds reverse order
- Draft picks are locked with database transactions using `lockForUpdate()` in `DraftController`
- Auto-pick system uses `AutoPickJob` dispatched with delay based on `pick_time_limit`
- Real-time updates via Laravel Reverb websockets on `draft.{leagueId}` channel
- Time tracking uses millisecond precision: `pick_started_at->valueOf()` for consistency

**Broadcasting**:
- Uses Laravel Reverb for real-time features
- Channels defined in `routes/channels.php`:
  - `countdown` - public channel
  - `draft.{leagueId}` - authenticated to league members via `FantasyLeague::hasUser()`
- Events: `DraftStarted`, `PlayerDrafted`, `DraftCompleted`, `CountdownStarted`

**Database**:
- SQLite by default (database/database.sqlite)
- Queue and cache both use database driver
- Important indexes on performance-critical queries (see migration 2025_10_10_115702)
- Unique constraints on draft picks to prevent race conditions

### Frontend Structure

**Tech Stack**:
- React 19 with TypeScript
- Inertia.js for SPA-like experience without API
- Tailwind CSS 3.4 + shadcn/ui components
- React Hook Form + Zod for form validation
- Laravel Echo + Pusher for real-time features

**Key Layouts**:
- `AuthenticatedLayout.tsx` - Main app layout with navigation
- `AuthLayout.tsx` - Guest pages (login, register)

**Critical Pages**:
- `Fantasy/Draft/Show.tsx` - Real-time draft interface with countdown timer and websocket updates
- `Fantasy/Show.tsx` - Fantasy league overview
- `Fantasy/Team/Show.tsx` - User's fantasy team management
- `Fantasy/Players/Index.tsx` - Player marketplace for buy/sell mode
- `Leagues/Show.tsx` - Prediction league with game predictions
- `Admin/*` - Admin CRUD interfaces for users, leagues, members

**Type Safety**:
- Global types in `resources/js/types/index.d.ts`
- Laravel backend types shared via Inertia props
- Run `npm run types` to verify TypeScript correctness

**Echo Setup**:
- Configured in `resources/js/echo.ts`
- Pusher client for Reverb connection
- Must authenticate before subscribing to private channels

## Important Patterns

### Invite Codes
Both `League` and `FantasyLeague` auto-generate secure 8-character invite codes on creation. Users can join via `/leagues/join/{inviteCode}` or `/fantasy/leagues/join/{inviteCode}`.

### Player Pricing (Weighted Average System)
Players have a sophisticated dynamic pricing system that prevents wild price swings:

**Formula**: `New Price = (70% × Avg of last 4 price history) + (30% × Current round FP × €100k)`

**How it works**:
- **Round 1**: Price = Fantasy Points × €100,000 (no history yet)
- **Rounds 2-5**: Uses weighted average of up to 4 previous round prices (70%) + current round performance (30%)
- **No play**: If player doesn't play a round, price marked as null (not included in future calculations)
- **Boundaries**: Minimum €100k, Maximum €10M
- **Stability**: Average price change between rounds ~24%, much smoother than direct FP calculation

**Example** (Shengelia):
- R1: €1.69M (16.9 FP) - First game
- R2: €1.87M (+10.7%) - 70% of €1.69M + 30% of new FP
- R3: €1.83M (-2.1%) - 70% of avg(€1.69M, €1.87M) + 30% of new FP
- R5: €2.13M (+0.9%) - Very stable transition

**Processing**: Automated via `php artisan rounds:process-prices` (runs hourly via scheduler)

### Fantasy Team Points (Position Multipliers)
Team points are calculated after each round based on player performance with position-based multipliers:

**Multipliers**:
- **Starters** (positions 1-5): 100% of fantasy points
- **Sixth Man** (position 6): 75% of fantasy points
- **Bench** (positions 7-10 or null): 50% of fantasy points

**How it works**:
- After each round, player fantasy points are calculated from game statistics
- Each player's points are multiplied by their lineup position multiplier
- Team's `total_points` is the sum of all adjusted player points
- Teams compete in fantasy leagues based on total_points

**Example**:
- Starter with 20 FP: 20 × 1.0 = 20 points
- Sixth man with 15 FP: 15 × 0.75 = 11.25 points
- Bench player with 10 FP: 10 × 0.5 = 5 points
- **Team Total**: 36.25 points

**Processing**: Automated via `php artisan fantasy:calculate-team-points` (runs after price processing in smart scraper)

**Lineup Management & Round Performance**:
- Users manage lineups at `/fantasy/leagues/{id}/lineup`
- Round selector dropdown shows only **past and current rounds** (excludes future rounds)
- **View mode** (finished rounds): Display-only, shows points breakdown (FP × multiplier = team points)
- **Edit mode** (future/current rounds): Allows lineup and formation changes
- Multiplier badges shown throughout UI: Green 100%, Yellow 75%, Blue 50%

**Round Locking System** (CRITICAL):
- **Active rounds are LOCKED**: Rounds lock at the earliest game's scheduled time, ALL changes are blocked
- **Locking triggers** (whichever comes first):
  1. **Scheduled time reached**: Locks when earliest game's `scheduled_at` time arrives (prevents pre-game cheating)
  2. **Game actually starts**: Locks when scraper detects game has started (backup)
- **Blocked actions during active rounds**:
  - Lineup changes (drag/drop disabled, save button hidden)
  - Formation changes
  - Player buying/selling in marketplace
- **UI indicators**: Red alert banner shows "Round X in Progress!" message
- **Backend validation**: Server-side checks prevent changes even if frontend bypassed
- **Lock release**: Automatically unlocks when all games in the round finish
- **No cheating window**: Users cannot make changes after scheduled game time, regardless of scraper frequency
- **Helper methods**:
  - `Game::isRoundActive($championshipId, $round)` - Check if specific round is active (time-based + status-based)
  - `Game::getCurrentActiveRound($championshipId)` - Get current active round number (null if none)

### Draft Pick Time Handling
The draft system uses millisecond timestamps (`valueOf()`) to avoid timezone issues:
```php
$pickStartedAtMs = $this->pick_started_at->valueOf();
$endTime = $pickStartedAtMs + ($this->pick_time_limit * 1000);
$remaining = max(0, ($endTime - now()->valueOf()) / 1000);
```

### Admin Access
Admin middleware checks `is_admin` boolean on User model. Admin routes prefixed with `/admin` in `routes/web.php`.

### Web Scraping
EuroLeague data is scraped from official feeds API. The scraper:
- Downloads team logos to `storage/app/public/team-logos/`
- Processes games from all 38 regular season rounds
- **Default: Scrapes ALL historical games** (use `--recent-games` to limit to last 7 days)
- Cleans up games older than 14 days
- Uses rate limiting (100ms delay between rounds)

## Development Notes

- Run `php artisan queue:listen` in development for draft auto-picks to work
- Ensure `BROADCAST_CONNECTION=reverb` and Reverb is running for real-time features
- The `composer dev` script runs all necessary processes concurrently
- SSR support available but optional - use `composer dev:ssr` if needed
- Admin seeder may exist - check `database/seeders/` for initial admin user
- Storage link required for team logos: `php artisan storage:link`
