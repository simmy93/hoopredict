import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Award, DollarSign, Medal, Target, TrendingUp, Trophy } from 'lucide-react';

interface FantasyTeam {
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

interface Props {
    selectedRound: string | number;
    availableRounds: number[];
    fantasyBudgetLeaders: FantasyTeam[];
    fantasyDraftLeaders: FantasyTeam[];
    predictionLeaders: PredictionLeader[];
    topPlayers: Player[];
    bestValuePlayers: Player[];
    championship: any;
}

export default function Index({
    selectedRound,
    availableRounds,
    fantasyBudgetLeaders,
    fantasyDraftLeaders,
    predictionLeaders,
    topPlayers,
    bestValuePlayers,
}: Props) {
    const handleRoundChange = (round: string) => {
        router.get('/statistics', { round }, { preserveState: true, preserveScroll: true });
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
                        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 lg:grid-cols-5">
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
                                                    className="group relative flex items-center justify-between overflow-hidden rounded-lg border-2 bg-gradient-to-r from-white to-purple-50/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-400/50 hover:shadow-lg dark:from-slate-900 dark:to-purple-950/20"
                                                >
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-pink-500/0 transition-all duration-500 group-hover:from-purple-500/5 group-hover:to-pink-500/5" />

                                                    <div className="relative z-10 flex items-center gap-4">
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
                                                            <div className="text-sm text-muted-foreground">
                                                                {team.user_name} • {team.league_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="relative z-10 text-right">
                                                        <div className="bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-lg font-bold text-transparent">
                                                            {team.total_points} pts
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{team.efficiency} pts/€M</div>
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
                                                    className="group relative flex items-center justify-between overflow-hidden rounded-lg border-2 bg-gradient-to-r from-white to-amber-50/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/50 hover:shadow-lg dark:from-slate-900 dark:to-amber-950/20"
                                                >
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-orange-500/0 transition-all duration-500 group-hover:from-amber-500/5 group-hover:to-orange-500/5" />

                                                    <div className="relative z-10 flex items-center gap-4">
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
                                                            <div className="text-sm text-muted-foreground">
                                                                {team.user_name} • {team.league_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="relative z-10 text-right">
                                                        <div className="bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-lg font-bold text-transparent">
                                                            {team.total_points} pts
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
                                                    className="group relative flex items-center justify-between overflow-hidden rounded-lg border-2 bg-gradient-to-r from-white to-green-50/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-green-400/50 hover:shadow-lg dark:from-slate-900 dark:to-green-950/20"
                                                >
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 to-emerald-500/0 transition-all duration-500 group-hover:from-green-500/5 group-hover:to-emerald-500/5" />

                                                    <div className="relative z-10 flex items-center gap-4">
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
                                                    <div className="relative z-10 text-right">
                                                        <div className="bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-lg font-bold text-transparent">
                                                            {leader.points} pts
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{leader.accuracy}% accuracy</div>
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
                                                    className="group relative flex items-center justify-between overflow-hidden rounded-lg border-2 bg-gradient-to-r from-white to-blue-50/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/50 hover:shadow-lg dark:from-slate-900 dark:to-blue-950/20"
                                                >
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-cyan-500/0 transition-all duration-500 group-hover:from-blue-500/5 group-hover:to-cyan-500/5" />

                                                    <div className="relative z-10 flex items-center gap-4">
                                                        <div
                                                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold shadow-lg ${
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
                                                        <div>
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
                                                    <div className="relative z-10 text-right">
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
                                                    className="group relative flex items-center justify-between overflow-hidden rounded-lg border-2 bg-gradient-to-r from-white to-emerald-50/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/50 hover:shadow-lg dark:from-slate-900 dark:to-emerald-950/20"
                                                >
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-teal-500/0 transition-all duration-500 group-hover:from-emerald-500/5 group-hover:to-teal-500/5" />

                                                    <div className="relative z-10 flex items-center gap-4">
                                                        <div
                                                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold shadow-lg ${
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
                                                        <div>
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
                                                            <div className="text-sm text-muted-foreground">
                                                                {player.team} • €{(player.price / 1000000).toFixed(1)}M
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="relative z-10 text-right">
                                                        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-lg font-bold text-transparent">
                                                            {player.value_rating} pts/€M
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {player.total_fantasy_points} pts ({player.games_played} games)
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
