<?php

namespace App\Http\Controllers;

use App\Models\FantasyTeam;
use App\Models\FantasyTeamRoundPoints;
use App\Models\Player;
use App\Models\Game;
use App\Models\Championship;
use App\Models\Team;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class StatisticsController extends Controller
{
    public function index(Request $request)
    {
        $selectedRound = $request->input('round', 'all');

        // Get available rounds
        $availableRounds = Game::select('round')
            ->distinct()
            ->orderBy('round')
            ->pluck('round');

        // Get active championship
        $championship = Championship::where('is_active', true)->first();

        // Fantasy League Statistics
        $fantasyBudgetLeaders = $this->getFantasyLeaders('budget', $selectedRound);
        $fantasyDraftLeaders = $this->getFantasyLeaders('draft', $selectedRound);

        // Prediction League Statistics
        $predictionLeaders = $this->getPredictionLeaders($selectedRound);

        // Player Statistics
        $topPlayers = $this->getTopPlayers($selectedRound);
        $bestValuePlayers = $this->getBestValuePlayers($selectedRound);

        // Real Team Statistics (EuroLeague teams)
        $teamStatistics = $this->getTeamStatistics($championship);

        return Inertia::render('Statistics/Index', [
            'selectedRound' => $selectedRound,
            'availableRounds' => $availableRounds,
            'fantasyBudgetLeaders' => $fantasyBudgetLeaders,
            'fantasyDraftLeaders' => $fantasyDraftLeaders,
            'predictionLeaders' => $predictionLeaders,
            'topPlayers' => $topPlayers,
            'bestValuePlayers' => $bestValuePlayers,
            'championship' => $championship,
            'teamStatistics' => $teamStatistics,
        ]);
    }

    private function getFantasyLeaders($mode, $round)
    {
        if ($round === 'all') {
            // Use cumulative total_points for all rounds
            $query = FantasyTeam::with(['user', 'fantasyLeague'])
                ->whereHas('fantasyLeague', function ($q) use ($mode) {
                    $q->where('mode', $mode);
                })
                ->select('fantasy_teams.*');

            return $query->orderBy('total_points', 'desc')
                ->take(10)
                ->get()
                ->map(function ($team) {
                    return [
                        'id' => $team->id,
                        'team_name' => $team->team_name,
                        'user_name' => $team->user->name,
                        'league_name' => $team->fantasyLeague->name,
                        'total_points' => round($team->total_points, 2),
                        'budget_spent' => $team->budget_spent,
                        'budget_remaining' => $team->budget_remaining,
                        'efficiency' => $team->budget_spent > 0
                            ? round($team->total_points / ($team->budget_spent / 1000000), 2)
                            : 0, // Points per million spent
                    ];
                });
        } else {
            // Use round-specific points
            return FantasyTeamRoundPoints::with(['fantasyTeam.user', 'fantasyTeam.fantasyLeague'])
                ->where('round', $round)
                ->whereHas('fantasyTeam.fantasyLeague', function ($q) use ($mode) {
                    $q->where('mode', $mode);
                })
                ->orderBy('points', 'desc')
                ->take(10)
                ->get()
                ->map(function ($roundPoints) {
                    $team = $roundPoints->fantasyTeam;
                    return [
                        'id' => $team->id,
                        'team_name' => $team->team_name,
                        'user_name' => $team->user->name,
                        'league_name' => $team->fantasyLeague->name,
                        'total_points' => round($roundPoints->points, 2),
                        'budget_spent' => $team->budget_spent,
                        'budget_remaining' => $team->budget_remaining,
                        'efficiency' => $team->budget_spent > 0
                            ? round($roundPoints->points / ($team->budget_spent / 1000000), 2)
                            : 0, // Points per million spent
                    ];
                });
        }
    }

    private function getPredictionLeaders($round)
    {
        // Aggregate prediction statistics from predictions table
        $query = DB::table('predictions')
            ->join('users', 'predictions.user_id', '=', 'users.id')
            ->join('leagues', 'predictions.league_id', '=', 'leagues.id')
            ->join('games', 'predictions.game_id', '=', 'games.id')
            ->where('games.status', 'finished')
            ->select(
                'users.id as user_id',
                'users.name as user_name',
                'leagues.id as league_id',
                'leagues.name as league_name',
                DB::raw('SUM(predictions.points_earned) as total_points'),
                DB::raw('COUNT(predictions.id) as total_predictions'),
                DB::raw('SUM(CASE WHEN predictions.points_earned > 0 THEN 1 ELSE 0 END) as correct_predictions')
            )
            ->groupBy('users.id', 'users.name', 'leagues.id', 'leagues.name');

        // Filter by round if specified
        if ($round !== 'all') {
            $query->where('games.round', $round);
        }

        return $query->orderBy('total_points', 'desc')
            ->take(10)
            ->get()
            ->map(function ($row) {
                return [
                    'user_name' => $row->user_name,
                    'league_name' => $row->league_name,
                    'points' => $row->total_points ?? 0,
                    'correct_predictions' => $row->correct_predictions ?? 0,
                    'total_predictions' => $row->total_predictions ?? 0,
                    'accuracy' => $row->total_predictions > 0
                        ? round(($row->correct_predictions / $row->total_predictions) * 100, 1)
                        : 0,
                ];
            });
    }

    private function getTopPlayers($round)
    {
        if ($round === 'all') {
            // Get players with highest total fantasy points across all rounds
            return Player::with('team')
                ->select('players.*')
                ->selectRaw('SUM(player_game_stats.fantasy_points) as total_fantasy_points')
                ->selectRaw('COUNT(player_game_stats.id) as games_played')
                ->selectRaw('AVG(player_game_stats.fantasy_points) as avg_fantasy_points')
                ->join('player_game_stats', 'players.id', '=', 'player_game_stats.player_id')
                ->groupBy('players.id')
                ->orderByDesc('total_fantasy_points')
                ->take(10)
                ->get()
                ->map(function ($player) {
                    return [
                        'id' => $player->id,
                        'name' => $player->name,
                        'team' => $player->team->name ?? 'N/A',
                        'position' => $player->position,
                        'price' => $player->price,
                        'photo_url' => $player->photo_url,
                        'photo_headshot_url' => $player->photo_headshot_url,
                        'total_fantasy_points' => round($player->total_fantasy_points, 2),
                        'games_played' => $player->games_played,
                        'avg_fantasy_points' => round($player->avg_fantasy_points, 2),
                    ];
                });
        } else {
            // Get players with highest fantasy points in specific round
            return Player::with('team')
                ->select('players.*')
                ->selectRaw('SUM(player_game_stats.fantasy_points) as round_fantasy_points')
                ->join('player_game_stats', 'players.id', '=', 'player_game_stats.player_id')
                ->join('games', 'player_game_stats.game_id', '=', 'games.id')
                ->where('games.round', $round)
                ->groupBy('players.id')
                ->orderByDesc('round_fantasy_points')
                ->take(10)
                ->get()
                ->map(function ($player) {
                    return [
                        'id' => $player->id,
                        'name' => $player->name,
                        'team' => $player->team->name ?? 'N/A',
                        'position' => $player->position,
                        'price' => $player->price,
                        'photo_url' => $player->photo_url,
                        'photo_headshot_url' => $player->photo_headshot_url,
                        'round_fantasy_points' => round($player->round_fantasy_points, 2),
                    ];
                });
        }
    }

    private function getBestValuePlayers($round)
    {
        if ($round === 'all') {
            return Player::with('team')
                ->select('players.*')
                ->selectRaw('SUM(player_game_stats.fantasy_points) as total_fantasy_points')
                ->selectRaw('COUNT(player_game_stats.id) as games_played')
                ->join('player_game_stats', 'players.id', '=', 'player_game_stats.player_id')
                ->where('players.price', '>', 0)
                ->groupBy('players.id')
                ->having('games_played', '>=', 3) // At least 3 games played
                ->get()
                ->map(function ($player) {
                    $valueRating = $player->total_fantasy_points / ($player->price / 1000000);
                    return [
                        'id' => $player->id,
                        'name' => $player->name,
                        'team' => $player->team->name ?? 'N/A',
                        'position' => $player->position,
                        'price' => $player->price,
                        'photo_url' => $player->photo_url,
                        'photo_headshot_url' => $player->photo_headshot_url,
                        'total_fantasy_points' => round($player->total_fantasy_points, 2),
                        'games_played' => $player->games_played,
                        'value_rating' => round($valueRating, 2), // Points per million
                    ];
                })
                ->sortByDesc('value_rating')
                ->take(10)
                ->values();
        } else {
            return collect([]); // Round-specific value is less meaningful
        }
    }

    /**
     * Get detailed stats for a specific player across all rounds
     */
    public function playerStats(Player $player)
    {
        $stats = DB::table('player_game_stats')
            ->join('games', 'player_game_stats.game_id', '=', 'games.id')
            ->where('player_game_stats.player_id', $player->id)
            ->where('games.status', 'finished')
            ->select('games.round', 'games.scheduled_at', 'player_game_stats.*')
            ->orderBy('games.round')
            ->get();

        return response()->json([
            'player' => $player->load('team'),
            'stats' => $stats,
        ]);
    }

    /**
     * Show team lineup page - view any team's lineup for finished rounds
     */
    public function showTeamLineup(FantasyTeam $team)
    {
        // Get round stats for this team
        $roundStats = FantasyTeamRoundPoints::where('fantasy_team_id', $team->id)
            ->orderBy('round')
            ->get();

        // Get all available rounds for this championship
        $allRounds = Game::select('round')
            ->where('championship_id', $team->fantasyLeague->championship_id)
            ->distinct()
            ->where('status', 'finished')
            ->orderBy('round')
            ->pluck('round');

        return Inertia::render('Statistics/TeamLineup', [
            'team' => $team->load(['user', 'fantasyLeague.championship']),
            'roundStats' => $roundStats,
            'allRounds' => $allRounds,
        ]);
    }

    /**
     * Get detailed stats for a specific fantasy team across all rounds
     */
    public function teamStats(FantasyTeam $team)
    {
        $roundStats = FantasyTeamRoundPoints::where('fantasy_team_id', $team->id)
            ->orderBy('round')
            ->get();

        // Get all available rounds
        $allRounds = Game::select('round')
            ->where('championship_id', $team->fantasyLeague->championship_id)
            ->distinct()
            ->where('status', 'finished')
            ->orderBy('round')
            ->pluck('round');

        return response()->json([
            'team' => $team->load(['user', 'fantasyLeague.championship']),
            'round_stats' => $roundStats,
            'all_rounds' => $allRounds,
        ]);
    }

    /**
     * Get lineup details for a specific team and round
     */
    public function teamLineup(FantasyTeam $team, $round)
    {
        // Get lineup history for this specific round
        $lineupHistory = DB::table('fantasy_team_lineup_history')
            ->where('fantasy_team_id', $team->id)
            ->where('round', $round)
            ->get();

        // Get the lineup_type from the first history record (all records have the same lineup_type for a round)
        $historicalLineupType = $lineupHistory->first()?->lineup_type ?? $team->lineup_type;

        // Get team players with their historical lineup positions for the specific round
        $teamPlayers = $lineupHistory->map(function ($history) use ($round) {
            // Get the player through fantasy_team_players
            $teamPlayer = DB::table('fantasy_team_players')
                ->where('id', $history->fantasy_team_player_id)
                ->first();

            if (!$teamPlayer) {
                return null;
            }

            // Get player details
            $player = DB::table('players')
                ->where('id', $teamPlayer->player_id)
                ->first();

            if (!$player) {
                return null;
            }

            // Get player team
            $playerTeam = DB::table('teams')
                ->where('id', $player->team_id)
                ->first();

            // Get round-specific fantasy points
            $roundStats = DB::table('player_game_stats')
                ->join('games', 'player_game_stats.game_id', '=', 'games.id')
                ->where('player_game_stats.player_id', $player->id)
                ->where('games.round', $round)
                ->where('games.status', 'finished')
                ->select('player_game_stats.fantasy_points')
                ->first();

            $multiplier = $this->getPositionMultiplier($history->lineup_position, $history->is_captain);

            return [
                'id' => $teamPlayer->id,
                'fantasy_team_id' => $teamPlayer->fantasy_team_id,
                'player_id' => $player->id,
                'lineup_position' => $history->lineup_position,
                'is_captain' => (bool) $history->is_captain,
                'purchase_price' => $teamPlayer->purchase_price,
                'points_earned' => $teamPlayer->points_earned,
                'round_fantasy_points' => $roundStats ? $roundStats->fantasy_points : 0,
                'multiplier' => $multiplier,
                'round_team_points' => $roundStats
                    ? $roundStats->fantasy_points * $multiplier
                    : 0,
                'player' => [
                    'id' => $player->id,
                    'name' => $player->name,
                    'position' => $player->position,
                    'price' => $player->price,
                    'photo_url' => $player->photo_url,
                    'photo_headshot_url' => $player->photo_headshot_url,
                    'team' => [
                        'id' => $playerTeam->id,
                        'name' => $playerTeam->name,
                    ],
                ],
            ];
        })->filter(); // Remove nulls

        // Get round points
        $roundPoints = FantasyTeamRoundPoints::where('fantasy_team_id', $team->id)
            ->where('round', $round)
            ->first();

        return response()->json([
            'team' => $team->load(['user', 'fantasyLeague.championship']),
            'team_players' => $teamPlayers->values(),
            'lineup_type' => $historicalLineupType,
            'round_total_points' => $roundPoints ? $roundPoints->points : null,
        ]);
    }

    /**
     * Get position multiplier based on lineup position and captain status
     */
    private function getPositionMultiplier($lineupPosition, $isCaptain)
    {
        if ($isCaptain) {
            return 2.0; // Captain gets 200%
        }

        if ($lineupPosition >= 1 && $lineupPosition <= 5) {
            return 1.0; // Starters get 100%
        }

        if ($lineupPosition === 6) {
            return 0.75; // Sixth man gets 75%
        }

        return 0.5; // Bench gets 50%
    }

    /**
     * Get real team statistics (EuroLeague teams)
     */
    private function getTeamStatistics($championship)
    {
        if (!$championship) {
            return [
                'standings' => [],
                'hottestTeams' => [],
                'coldestTeams' => [],
                'bestHomeTeams' => [],
                'bestAwayTeams' => [],
            ];
        }

        $teams = Team::where('championship_id', $championship->id)->get();
        $teamStats = [];

        foreach ($teams as $team) {
            // Get all finished games for this team
            $homeGames = Game::where('championship_id', $championship->id)
                ->where('home_team_id', $team->id)
                ->where('status', 'finished')
                ->orderBy('scheduled_at', 'desc')
                ->get();

            $awayGames = Game::where('championship_id', $championship->id)
                ->where('away_team_id', $team->id)
                ->where('status', 'finished')
                ->orderBy('scheduled_at', 'desc')
                ->get();

            // Calculate home record
            $homeWins = $homeGames->filter(fn($g) => $g->home_score > $g->away_score)->count();
            $homeLosses = $homeGames->count() - $homeWins;
            $homePointsFor = $homeGames->sum('home_score');
            $homePointsAgainst = $homeGames->sum('away_score');

            // Calculate away record
            $awayWins = $awayGames->filter(fn($g) => $g->away_score > $g->home_score)->count();
            $awayLosses = $awayGames->count() - $awayWins;
            $awayPointsFor = $awayGames->sum('away_score');
            $awayPointsAgainst = $awayGames->sum('home_score');

            // Overall stats
            $totalWins = $homeWins + $awayWins;
            $totalLosses = $homeLosses + $awayLosses;
            $totalGames = $totalWins + $totalLosses;
            $totalPointsFor = $homePointsFor + $awayPointsFor;
            $totalPointsAgainst = $homePointsAgainst + $awayPointsAgainst;

            // Get last 5 games for form
            $allGames = Game::where('championship_id', $championship->id)
                ->where('status', 'finished')
                ->where(function ($q) use ($team) {
                    $q->where('home_team_id', $team->id)
                      ->orWhere('away_team_id', $team->id);
                })
                ->orderBy('scheduled_at', 'desc')
                ->take(5)
                ->get();

            $form = $allGames->map(function ($game) use ($team) {
                $isHome = $game->home_team_id === $team->id;
                $won = $isHome
                    ? $game->home_score > $game->away_score
                    : $game->away_score > $game->home_score;
                return $won ? 'W' : 'L';
            })->reverse()->values()->toArray();

            // Calculate current streak
            $streak = $this->calculateStreak($allGames, $team->id);

            $teamStats[] = [
                'id' => $team->id,
                'name' => $team->name,
                'code' => $team->code,
                'logo_url' => $team->logo_url,
                'wins' => $totalWins,
                'losses' => $totalLosses,
                'games_played' => $totalGames,
                'win_pct' => $totalGames > 0 ? round($totalWins / $totalGames * 100, 1) : 0,
                'points_for' => $totalPointsFor,
                'points_against' => $totalPointsAgainst,
                'point_diff' => $totalPointsFor - $totalPointsAgainst,
                'avg_points_for' => $totalGames > 0 ? round($totalPointsFor / $totalGames, 1) : 0,
                'avg_points_against' => $totalGames > 0 ? round($totalPointsAgainst / $totalGames, 1) : 0,
                'home_record' => "{$homeWins}-{$homeLosses}",
                'away_record' => "{$awayWins}-{$awayLosses}",
                'home_wins' => $homeWins,
                'home_losses' => $homeLosses,
                'away_wins' => $awayWins,
                'away_losses' => $awayLosses,
                'form' => $form,
                'streak' => $streak,
                'streak_count' => abs($streak),
                'streak_type' => $streak > 0 ? 'W' : ($streak < 0 ? 'L' : '-'),
            ];
        }

        // Sort by wins (standings)
        $standings = collect($teamStats)->sortByDesc(function ($team) {
            return [$team['wins'], $team['point_diff']];
        })->values();

        // Hottest teams (best current streak)
        $hottestTeams = collect($teamStats)
            ->filter(fn($t) => $t['streak'] > 0)
            ->sortByDesc('streak')
            ->take(5)
            ->values();

        // Coldest teams (worst current streak)
        $coldestTeams = collect($teamStats)
            ->filter(fn($t) => $t['streak'] < 0)
            ->sortBy('streak')
            ->take(5)
            ->values();

        // Best home teams
        $bestHomeTeams = collect($teamStats)
            ->filter(fn($t) => ($t['home_wins'] + $t['home_losses']) >= 3)
            ->sortByDesc(function ($t) {
                $homeGames = $t['home_wins'] + $t['home_losses'];
                return $homeGames > 0 ? $t['home_wins'] / $homeGames : 0;
            })
            ->take(5)
            ->values();

        // Best away teams
        $bestAwayTeams = collect($teamStats)
            ->filter(fn($t) => ($t['away_wins'] + $t['away_losses']) >= 3)
            ->sortByDesc(function ($t) {
                $awayGames = $t['away_wins'] + $t['away_losses'];
                return $awayGames > 0 ? $t['away_wins'] / $awayGames : 0;
            })
            ->take(5)
            ->values();

        return [
            'standings' => $standings,
            'hottestTeams' => $hottestTeams,
            'coldestTeams' => $coldestTeams,
            'bestHomeTeams' => $bestHomeTeams,
            'bestAwayTeams' => $bestAwayTeams,
        ];
    }

    /**
     * Calculate current winning/losing streak
     * Returns positive number for win streak, negative for loss streak
     */
    private function calculateStreak($games, $teamId)
    {
        if ($games->isEmpty()) {
            return 0;
        }

        $streak = 0;
        $firstResult = null;

        foreach ($games as $game) {
            $isHome = $game->home_team_id === $teamId;
            $won = $isHome
                ? $game->home_score > $game->away_score
                : $game->away_score > $game->home_score;

            if ($firstResult === null) {
                $firstResult = $won;
            }

            if ($won === $firstResult) {
                $streak++;
            } else {
                break;
            }
        }

        return $firstResult ? $streak : -$streak;
    }
}
