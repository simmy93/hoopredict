import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Award, DollarSign, Medal, Target, TrendingUp, Trophy, Flame, Home, Plane, Snowflake } from 'lucide-react';
import StatsDetailModal from '@/components/StatsDetailModal';
import axios from 'axios';

interface FantasyTeam {
    id: number;
    team_name: string;
    user_name: string;
    league_name: string;
    total_points: number;
    budget_spent: number;
    budget_remaining: number;
    efficiency: number;
}

interface PredictionLeader {
    user_name: string;
    league_name: string;
    points: number;
    correct_predictions: number;
    total_predictions: number;
    accuracy: number;
}

interface Player {
    id: number;
    name: string;
    team: string;
    position: string;
    price: number;
    total_fantasy_points?: number;
    round_fantasy_points?: number;
    games_played?: number;
    avg_fantasy_points?: number;
    value_rating?: number;
    photo_url: string | null;
    photo_headshot_url: string | null;
}

interface TeamStat {
    id: number;
    name: string;
    code: string;
    logo_url: string | null;
    wins: number;
    losses: number;
    games_played: number;
    win_pct: number;
    points_for: number;
    points_against: number;
    point_diff: number;
    avg_points_for: number;
    avg_points_against: number;
    home_record: string;
    away_record: string;
    home_wins: number;
    home_losses: number;
    away_wins: number;
    away_losses: number;
    form: string[];
    streak: number;
    streak_count: number;
    streak_type: string;
}

interface TeamStatistics {
    standings: TeamStat[];
    hottestTeams: TeamStat[];
    coldestTeams: TeamStat[];
    bestHomeTeams: TeamStat[];
    bestAwayTeams: TeamStat[];
}

interface Props {
    selectedRound: string | number;
    availableRounds: number[];
    fantasyBudgetLeaders: FantasyTeam[];
    fantasyDraftLeaders: FantasyTeam[];
    predictionLeaders: PredictionLeader[];
    topPlayers: Player[];
    bestValuePlayers: Player[];
    championship: any;
    teamStatistics: TeamStatistics;
}

export default function Index({
    selectedRound,
    availableRounds,
    fantasyBudgetLeaders,
    fantasyDraftLeaders,
    predictionLeaders,
    topPlayers,
    bestValuePlayers,
    teamStatistics,
}: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'player' | null>(null);
    const [modalData, setModalData] = useState<any>(null);
    const [modalLoading, setModalLoading] = useState(false);

    const handleRoundChange = (round: string) => {
        router.get('/statistics', { round }, { preserveState: true, preserveScroll: true });
    };

    const handlePlayerClick = async (playerId: number) => {
        setModalType('player');
        setModalOpen(true);
        setModalLoading(true);
        setModalData(null);

        try {
            const response = await axios.get(`/statistics/players/${playerId}`);
            setModalData(response.data);
        } catch (error) {
            console.error('Failed to load player stats:', error);
        } finally {
            setModalLoading(false);
        }
    };

    const handleTeamClick = (teamId: number) => {
        // Navigate to dedicated team lineup page
        router.visit(`/statistics/teams/${teamId}/view`);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Statistics" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header with Round Selector */}
                    <div className="mb-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="text-primary h-6 w-6 sm:h-7 sm:w-7" />
                                    <h1 className="text-2xl font-bold">Statistics</h1>
                                </div>
                                <p className="mt-1 text-muted-foreground">View top performers across fantasy and prediction leagues</p>
                            </div>
                            <div className="w-full sm:w-48">
                                <Select value={selectedRound.toString()} onValueChange={handleRoundChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Rounds</SelectItem>
                                        {availableRounds.map((round) => (
                                            <SelectItem key={round} value={round.toString()}>
                                                Round {round}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Tabs for Different Categories */}
                    <Tabs defaultValue="fantasy-budget" className="space-y-6">
                        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 lg:grid-cols-6">
                            <TabsTrigger value="fantasy-budget" className="py-3 text-xs sm:text-sm">
                                <DollarSign className="mr-1 h-4 w-4 flex-shrink-0 sm:mr-2" />
                                <span className="truncate">Budget Mode</span>
                            </TabsTrigger>
                            <TabsTrigger value="fantasy-draft" className="py-3 text-xs sm:text-sm">
                                <Trophy className="mr-1 h-4 w-4 flex-shrink-0 sm:mr-2" />
                                <span className="truncate">Draft Mode</span>
                            </TabsTrigger>
                            <TabsTrigger value="predictions" className="py-3 text-xs sm:text-sm">
                                <Target className="mr-1 h-4 w-4 flex-shrink-0 sm:mr-2" />
                                <span className="truncate">Predictions</span>
                            </TabsTrigger>
                            <TabsTrigger value="top-players" className="py-3 text-xs sm:text-sm">
                                <Award className="mr-1 h-4 w-4 flex-shrink-0 sm:mr-2" />
                                <span className="truncate">Top Players</span>
                            </TabsTrigger>
                            <TabsTrigger value="best-value" className="py-3 text-xs sm:text-sm">
                                <TrendingUp className="mr-1 h-4 w-4 flex-shrink-0 sm:mr-2" />
                                <span className="truncate">Best Value</span>
                            </TabsTrigger>
                            <TabsTrigger value="team-stats" className="py-3 text-xs sm:text-sm">
                                <Flame className="mr-1 h-4 w-4 flex-shrink-0 sm:mr-2" />
                                <span className="truncate">Team Stats</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Fantasy Budget Mode Leaders */}
                        <TabsContent value="fantasy-budget">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Top Fantasy Teams (Budget Mode)
                                    </CardTitle>
                                    <CardDescription>
                                        Best performing teams in budget leagues
                                        {selectedRound !== 'all' && ` - Round ${selectedRound}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {fantasyBudgetLeaders.length === 0 ? (
                                        <p className="py-8 text-center text-muted-foreground">No data available</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {fantasyBudgetLeaders.map((team, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleTeamClick(team.id)}
                                                    className="group relative overflow-hidden rounded-lg border-2 bg-gradient-to-r from-white to-purple-50/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-400/50 hover:shadow-lg dark:from-slate-900 dark:to-purple-950/20 cursor-pointer"
                                                >
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-pink-500/0 transition-all duration-500 group-hover:from-purple-500/5 group-hover:to-pink-500/5" />

                                                    <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold shadow-lg ${
                                                                    index === 0
                                                                        ? 'animate-pulse bg-gradient-to-br from-yellow-400 to-yellow-600 text-white ring-2 ring-yellow-300'
                                                                        : index === 1
                                                                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white ring-2 ring-gray-200'
                                                                          : index === 2
                                                                            ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white ring-2 ring-orange-300'
                                                                            : 'bg-gradient-to-br from-purple-400 to-blue-500 text-white'
                                                                }`}
                                                            >
                                                                {index < 3 ? <Medal className="h-5 w-5" /> : index + 1}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                                                    {team.team_name}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground sm:hidden">
                                                                    {team.user_name}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground sm:hidden">
                                                                    {team.league_name}
                                                                </div>
                                                                <div className="hidden text-sm text-muted-foreground sm:block">
                                                                    {team.user_name} • {team.league_name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-baseline justify-between border-t border-gray-200 pt-2 dark:border-gray-700 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                                                            <div className="bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-lg font-bold text-transparent">
                                                                {team.total_points} pts
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">{team.efficiency} pts/€M</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Fantasy Draft Mode Leaders */}
                        <TabsContent value="fantasy-draft">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5" />
                                        Top Fantasy Teams (Draft Mode)
                                    </CardTitle>
                                    <CardDescription>
                                        Best performing teams in draft leagues
                                        {selectedRound !== 'all' && ` - Round ${selectedRound}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {fantasyDraftLeaders.length === 0 ? (
                                        <p className="py-8 text-center text-muted-foreground">No data available</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {fantasyDraftLeaders.map((team, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleTeamClick(team.id)}
                                                    className="group relative overflow-hidden rounded-lg border-2 bg-gradient-to-r from-white to-amber-50/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/50 hover:shadow-lg dark:from-slate-900 dark:to-amber-950/20 cursor-pointer"
                                                >
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-orange-500/0 transition-all duration-500 group-hover:from-amber-500/5 group-hover:to-orange-500/5" />

                                                    <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold shadow-lg ${
                                                                    index === 0
                                                                        ? 'animate-pulse bg-gradient-to-br from-yellow-400 to-yellow-600 text-white ring-2 ring-yellow-300'
                                                                        : index === 1
                                                                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white ring-2 ring-gray-200'
                                                                          : index === 2
                                                                            ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white ring-2 ring-orange-300'
                                                                            : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                                                                }`}
                                                            >
                                                                {index < 3 ? <Medal className="h-5 w-5" /> : index + 1}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400">
                                                                    {team.team_name}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground sm:hidden">
                                                                    {team.user_name}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground sm:hidden">
                                                                    {team.league_name}
                                                                </div>
                                                                <div className="hidden text-sm text-muted-foreground sm:block">
                                                                    {team.user_name} • {team.league_name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-baseline justify-between border-t border-gray-200 pt-2 dark:border-gray-700 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                                                            <div className="bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-lg font-bold text-transparent">
                                                                {team.total_points} pts
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Prediction Leaders */}
                        <TabsContent value="predictions">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        Top Predictors
                                    </CardTitle>
                                    <CardDescription>
                                        Best prediction league performers
                                        {selectedRound !== 'all' && ` - Round ${selectedRound}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {predictionLeaders.length === 0 ? (
                                        <p className="py-8 text-center text-muted-foreground">No data available</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {predictionLeaders.map((leader, index) => (
                                                <div
                                                    key={index}
                                                    className="group relative overflow-hidden rounded-lg border-2 bg-gradient-to-r from-white to-green-50/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-green-400/50 hover:shadow-lg dark:from-slate-900 dark:to-green-950/20"
                                                >
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 to-emerald-500/0 transition-all duration-500 group-hover:from-green-500/5 group-hover:to-emerald-500/5" />

                                                    <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold shadow-lg ${
                                                                    index === 0
                                                                        ? 'animate-pulse bg-gradient-to-br from-yellow-400 to-yellow-600 text-white ring-2 ring-yellow-300'
                                                                        : index === 1
                                                                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white ring-2 ring-gray-200'
                                                                          : index === 2
                                                                            ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white ring-2 ring-orange-300'
                                                                            : 'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
                                                                }`}
                                                            >
                                                                {index < 3 ? <Medal className="h-5 w-5" /> : index + 1}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold transition-colors group-hover:text-green-600 dark:group-hover:text-green-400">
                                                                    {leader.user_name}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">{leader.league_name}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-baseline justify-between border-t border-gray-200 pt-2 dark:border-gray-700 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                                                            <div className="bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-lg font-bold text-transparent">
                                                                {leader.points} pts
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">{leader.accuracy}% accuracy</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Top Players */}
                        <TabsContent value="top-players">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="h-5 w-5" />
                                        Top Performing Players
                                    </CardTitle>
                                    <CardDescription>
                                        Highest scoring players
                                        {selectedRound !== 'all' && ` - Round ${selectedRound}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {topPlayers.length === 0 ? (
                                        <p className="py-8 text-center text-muted-foreground">No data available</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {topPlayers.map((player, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handlePlayerClick(player.id)}
                                                    className="group relative overflow-hidden rounded-lg border-2 bg-gradient-to-r from-white to-blue-50/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/50 hover:shadow-lg dark:from-slate-900 dark:to-blue-950/20 cursor-pointer"
                                                >
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-cyan-500/0 transition-all duration-500 group-hover:from-blue-500/5 group-hover:to-cyan-500/5" />

                                                    <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold shadow-lg sm:mt-0 ${
                                                                    index === 0
                                                                        ? 'animate-pulse bg-gradient-to-br from-yellow-400 to-yellow-600 text-white ring-2 ring-yellow-300'
                                                                        : index === 1
                                                                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white ring-2 ring-gray-200'
                                                                          : index === 2
                                                                            ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white ring-2 ring-orange-300'
                                                                            : 'bg-gradient-to-br from-blue-400 to-cyan-500 text-white'
                                                                }`}
                                                            >
                                                                {index < 3 ? <Medal className="h-5 w-5" /> : index + 1}
                                                            </div>
                                                            <div className="flex-shrink-0">
                                                                {player.photo_headshot_url || player.photo_url ? (
                                                                    <img
                                                                        src={(player.photo_headshot_url || player.photo_url)!}
                                                                        alt={player.name}
                                                                        className="h-12 w-12 rounded-full object-cover object-top"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-bold">
                                                                        {player.name.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                                    {player.name}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {player.team} • {player.position}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-baseline justify-between border-t border-gray-200 pt-2 dark:border-gray-700 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                                                            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-lg font-bold text-transparent">
                                                                {selectedRound === 'all'
                                                                    ? `${player.total_fantasy_points} pts`
                                                                    : `${player.round_fantasy_points} pts`}
                                                            </div>
                                                            {selectedRound === 'all' && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    {player.avg_fantasy_points} avg ({player.games_played} games)
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Best Value Players */}
                        <TabsContent value="best-value">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Best Value Players
                                    </CardTitle>
                                    <CardDescription>Players with the best fantasy points per euro spent (minimum 3 games)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {selectedRound !== 'all' ? (
                                        <p className="py-8 text-center text-muted-foreground">Value ratings are only available for "All Rounds"</p>
                                    ) : bestValuePlayers.length === 0 ? (
                                        <p className="py-8 text-center text-muted-foreground">No data available</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {bestValuePlayers.map((player, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handlePlayerClick(player.id)}
                                                    className="group relative overflow-hidden rounded-lg border-2 bg-gradient-to-r from-white to-emerald-50/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/50 hover:shadow-lg dark:from-slate-900 dark:to-emerald-950/20 cursor-pointer"
                                                >
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-teal-500/0 transition-all duration-500 group-hover:from-emerald-500/5 group-hover:to-teal-500/5" />

                                                    <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold shadow-lg sm:mt-0 ${
                                                                    index === 0
                                                                        ? 'animate-pulse bg-gradient-to-br from-yellow-400 to-yellow-600 text-white ring-2 ring-yellow-300'
                                                                        : index === 1
                                                                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white ring-2 ring-gray-200'
                                                                          : index === 2
                                                                            ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white ring-2 ring-orange-300'
                                                                            : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                                                                }`}
                                                            >
                                                                {index < 3 ? <Medal className="h-5 w-5" /> : index + 1}
                                                            </div>
                                                            <div className="flex-shrink-0">
                                                                {player.photo_headshot_url || player.photo_url ? (
                                                                    <img
                                                                        src={(player.photo_headshot_url || player.photo_url)!}
                                                                        alt={player.name}
                                                                        className="h-12 w-12 rounded-full object-cover object-top"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-bold">
                                                                        {player.name.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                                                    {player.name}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground sm:hidden">
                                                                    {player.team}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground sm:hidden">
                                                                    €{(player.price / 1000000).toFixed(1)}M
                                                                </div>
                                                                <div className="hidden text-sm text-muted-foreground sm:block">
                                                                    {player.team} • €{(player.price / 1000000).toFixed(1)}M
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-baseline justify-between border-t border-gray-200 pt-2 dark:border-gray-700 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                                                            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-lg font-bold text-transparent">
                                                                {player.value_rating} pts/€M
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {player.total_fantasy_points} pts ({player.games_played} games)
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Team Statistics */}
                        <TabsContent value="team-stats">
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Hottest Teams */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Flame className="h-5 w-5 text-orange-500" />
                                            Hottest Teams
                                        </CardTitle>
                                        <CardDescription>Teams on winning streaks</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {teamStatistics.hottestTeams.length === 0 ? (
                                            <p className="py-8 text-center text-muted-foreground">No teams on winning streaks</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {teamStatistics.hottestTeams.map((team, index) => (
                                                    <div key={team.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold dark:bg-orange-900/30">
                                                                {index + 1}
                                                            </div>
                                                            {team.logo_url && (
                                                                <img src={team.logo_url} alt={team.name} className="h-8 w-8 object-contain" />
                                                            )}
                                                            <div>
                                                                <div className="font-semibold">{team.name}</div>
                                                                <div className="text-sm text-muted-foreground">{team.wins}-{team.losses}</div>
                                                            </div>
                                                        </div>
                                                        <div className="min-w-[85px] text-right">
                                                            <Badge className="bg-green-500 text-white">
                                                                {team.streak_count}W Streak
                                                            </Badge>
                                                            <div className="mt-1 flex gap-0.5 justify-end">
                                                                {team.form.map((result, i) => (
                                                                    <span key={i} className={`text-xs font-bold ${result === 'W' ? 'text-green-500' : 'text-red-500'}`}>
                                                                        {result}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Coldest Teams */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Snowflake className="h-5 w-5 text-blue-500" />
                                            Coldest Teams
                                        </CardTitle>
                                        <CardDescription>Teams on losing streaks</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {teamStatistics.coldestTeams.length === 0 ? (
                                            <p className="py-8 text-center text-muted-foreground">No teams on losing streaks</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {teamStatistics.coldestTeams.map((team, index) => (
                                                    <div key={team.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold dark:bg-blue-900/30">
                                                                {index + 1}
                                                            </div>
                                                            {team.logo_url && (
                                                                <img src={team.logo_url} alt={team.name} className="h-8 w-8 object-contain" />
                                                            )}
                                                            <div>
                                                                <div className="font-semibold">{team.name}</div>
                                                                <div className="text-sm text-muted-foreground">{team.wins}-{team.losses}</div>
                                                            </div>
                                                        </div>
                                                        <div className="min-w-[85px] text-right">
                                                            <Badge className="bg-red-500 text-white">
                                                                {team.streak_count}L Streak
                                                            </Badge>
                                                            <div className="mt-1 flex gap-0.5 justify-end">
                                                                {team.form.map((result, i) => (
                                                                    <span key={i} className={`text-xs font-bold ${result === 'W' ? 'text-green-500' : 'text-red-500'}`}>
                                                                        {result}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Best Home Teams */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Home className="h-5 w-5 text-green-500" />
                                            Best Home Teams
                                        </CardTitle>
                                        <CardDescription>Strongest at home</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {teamStatistics.bestHomeTeams.length === 0 ? (
                                            <p className="py-8 text-center text-muted-foreground">Not enough data</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {teamStatistics.bestHomeTeams.map((team, index) => (
                                                    <div key={team.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold dark:bg-green-900/30">
                                                                {index + 1}
                                                            </div>
                                                            {team.logo_url && (
                                                                <img src={team.logo_url} alt={team.name} className="h-8 w-8 object-contain" />
                                                            )}
                                                            <div>
                                                                <div className="font-semibold">{team.name}</div>
                                                                <div className="text-sm text-muted-foreground">Overall: {team.wins}-{team.losses}</div>
                                                            </div>
                                                        </div>
                                                        <div className="min-w-[85px] text-right">
                                                            <div className="font-bold text-green-600">{team.home_record}</div>
                                                            <div className="text-xs text-muted-foreground">Home Record</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Best Away Teams */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Plane className="h-5 w-5 text-purple-500" />
                                            Best Road Teams
                                        </CardTitle>
                                        <CardDescription>Strongest on the road</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {teamStatistics.bestAwayTeams.length === 0 ? (
                                            <p className="py-8 text-center text-muted-foreground">Not enough data</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {teamStatistics.bestAwayTeams.map((team, index) => (
                                                    <div key={team.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold dark:bg-purple-900/30">
                                                                {index + 1}
                                                            </div>
                                                            {team.logo_url && (
                                                                <img src={team.logo_url} alt={team.name} className="h-8 w-8 object-contain" />
                                                            )}
                                                            <div>
                                                                <div className="font-semibold">{team.name}</div>
                                                                <div className="text-sm text-muted-foreground">Overall: {team.wins}-{team.losses}</div>
                                                            </div>
                                                        </div>
                                                        <div className="min-w-[85px] text-right">
                                                            <div className="font-bold text-purple-600">{team.away_record}</div>
                                                            <div className="text-xs text-muted-foreground">Away Record</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Stats Detail Modal */}
            <StatsDetailModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                type={modalType}
                data={modalData}
                loading={modalLoading}
            />
        </AuthenticatedLayout>
    );
}
