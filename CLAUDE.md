# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HooPredict is a Laravel 12 + React (Inertia.js) application for basketball predictions and fantasy leagues, focused on EuroLeague competition. The application supports two main features:

1. **Prediction Leagues**: Users predict game outcomes and compete on leaderboards
2. **Fantasy Leagues**: Users draft real EuroLeague players and manage fantasy teams with two modes:
   - **Draft Mode**: Snake draft system with real-time websockets and auto-pick functionality
   - **Marketplace Mode**: Buy/sell players with dynamic pricing based on performance

## Common Commands

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

# Scrape EuroLeague data (all: teams, games, players, scores)
php artisan scrape:euroleague

# Scrape specific data
php artisan scrape:euroleague --teams    # Only scrape teams
php artisan scrape:euroleague --games    # Only scrape games/schedule
php artisan scrape:euroleague --scores   # Only update game scores
php artisan scrape:euroleague --players  # Only scrape players
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

### Player Pricing
Players have dynamic pricing in `Player` model:
- Base price stored in database
- `updatePriceBasedOnPerformance()` adjusts based on recent game stats (30+ pts = +10%, <5 pts = -10%)
- Average fantasy points calculated from last 5 games via `getAverageFantasyPointsAttribute`

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
- Skips games older than 7 days (unless finished with scores)
- Cleans up games older than 14 days
- Uses rate limiting (100ms delay between rounds)

## Development Notes

- Run `php artisan queue:listen` in development for draft auto-picks to work
- Ensure `BROADCAST_CONNECTION=reverb` and Reverb is running for real-time features
- The `composer dev` script runs all necessary processes concurrently
- SSR support available but optional - use `composer dev:ssr` if needed
- Admin seeder may exist - check `database/seeders/` for initial admin user
- Storage link required for team logos: `php artisan storage:link`
