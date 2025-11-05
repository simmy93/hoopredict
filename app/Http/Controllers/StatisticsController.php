<?php

namespace App\Http\Controllers;

use App\Models\FantasyTeam;
use App\Models\FantasyTeamRoundPoints;
use App\Models\Player;
use App\Models\Game;
use App\Models\Championship;
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

        return Inertia::render('Statistics/Index', [
            'selectedRound' => $selectedRound,
            'availableRounds' => $availableRounds,
            'fantasyBudgetLeaders' => $fantasyBudgetLeaders,
            'fantasyDraftLeaders' => $fantasyDraftLeaders,
            'predictionLeaders' => $predictionLeaders,
            'topPlayers' => $topPlayers,
            'bestValuePlayers' => $bestValuePlayers,
            'championship' => $championship,
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
                        'name' => $player->name,
                        'team' => $player->team->name ?? 'N/A',
                        'position' => $player->position,
                        'price' => $player->price,
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
                        'name' => $player->name,
                        'team' => $player->team->name ?? 'N/A',
                        'position' => $player->position,
                        'price' => $player->price,
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
                        'name' => $player->name,
                        'team' => $player->team->name ?? 'N/A',
                        'position' => $player->position,
                        'price' => $player->price,
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
}
