import React, { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, TrendingUp, DollarSign, Target, Medal, Award } from 'lucide-react'

interface FantasyTeam {
    team_name: string
    user_name: string
    league_name: string
    total_points: number
    budget_spent: number
    budget_remaining: number
    efficiency: number
}

interface PredictionLeader {
    user_name: string
    league_name: string
    points: number
    correct_predictions: number
    total_predictions: number
    accuracy: number
}

interface Player {
    name: string
    team: string
    position: string
    price: number
    total_fantasy_points?: number
    round_fantasy_points?: number
    games_played?: number
    avg_fantasy_points?: number
    value_rating?: number
}

interface Props {
    selectedRound: string | number
    availableRounds: number[]
    fantasyBudgetLeaders: FantasyTeam[]
    fantasyDraftLeaders: FantasyTeam[]
    predictionLeaders: PredictionLeader[]
    topPlayers: Player[]
    bestValuePlayers: Player[]
    championship: any
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
        router.get('/statistics', { round }, { preserveState: true, preserveScroll: true })
    }

    return (
        <AuthenticatedLayout>
            <Head title="Statistics" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header with Round Selector */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                                    <h1 className="text-2xl sm:text-3xl font-bold">Statistics</h1>
                                </div>
                                <p className="text-muted-foreground mt-1">
                                    View top performers across fantasy and prediction leagues
                                </p>
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
                        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto gap-2">
                            <TabsTrigger value="fantasy-budget" className="text-xs sm:text-sm py-3">
                                <DollarSign className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                <span className="truncate">Budget Mode</span>
                            </TabsTrigger>
                            <TabsTrigger value="fantasy-draft" className="text-xs sm:text-sm py-3">
                                <Trophy className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                <span className="truncate">Draft Mode</span>
                            </TabsTrigger>
                            <TabsTrigger value="predictions" className="text-xs sm:text-sm py-3">
                                <Target className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                <span className="truncate">Predictions</span>
                            </TabsTrigger>
                            <TabsTrigger value="top-players" className="text-xs sm:text-sm py-3">
                                <Award className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                                <span className="truncate">Top Players</span>
                            </TabsTrigger>
                            <TabsTrigger value="best-value" className="text-xs sm:text-sm py-3">
                                <TrendingUp className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
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
                                        <p className="text-center text-muted-foreground py-8">
                                            No data available
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {fantasyBudgetLeaders.map((team, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                                                index === 0
                                                                    ? 'bg-yellow-500 text-white'
                                                                    : index === 1
                                                                    ? 'bg-gray-400 text-white'
                                                                    : index === 2
                                                                    ? 'bg-orange-600 text-white'
                                                                    : 'bg-muted text-muted-foreground'
                                                            }`}
                                                        >
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold">{team.team_name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {team.user_name} • {team.league_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-primary">
                                                            {team.total_points} pts
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {team.efficiency} pts/€M
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
                                        <p className="text-center text-muted-foreground py-8">
                                            No data available
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {fantasyDraftLeaders.map((team, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                                                index === 0
                                                                    ? 'bg-yellow-500 text-white'
                                                                    : index === 1
                                                                    ? 'bg-gray-400 text-white'
                                                                    : index === 2
                                                                    ? 'bg-orange-600 text-white'
                                                                    : 'bg-muted text-muted-foreground'
                                                            }`}
                                                        >
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold">{team.team_name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {team.user_name} • {team.league_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-primary">
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
                                        <p className="text-center text-muted-foreground py-8">
                                            No data available
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {predictionLeaders.map((leader, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                                                index === 0
                                                                    ? 'bg-yellow-500 text-white'
                                                                    : index === 1
                                                                    ? 'bg-gray-400 text-white'
                                                                    : index === 2
                                                                    ? 'bg-orange-600 text-white'
                                                                    : 'bg-muted text-muted-foreground'
                                                            }`}
                                                        >
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold">{leader.user_name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {leader.league_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-primary">
                                                            {leader.points} pts
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {leader.accuracy}% accuracy
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
                                        <p className="text-center text-muted-foreground py-8">
                                            No data available
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {topPlayers.map((player, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                                                index === 0
                                                                    ? 'bg-yellow-500 text-white'
                                                                    : index === 1
                                                                    ? 'bg-gray-400 text-white'
                                                                    : index === 2
                                                                    ? 'bg-orange-600 text-white'
                                                                    : 'bg-muted text-muted-foreground'
                                                            }`}
                                                        >
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold">{player.name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {player.team} • {player.position}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-primary">
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
                                    <CardDescription>
                                        Players with the best fantasy points per euro spent (minimum 3 games)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {selectedRound !== 'all' ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            Value ratings are only available for "All Rounds"
                                        </p>
                                    ) : bestValuePlayers.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            No data available
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {bestValuePlayers.map((player, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                                                index === 0
                                                                    ? 'bg-yellow-500 text-white'
                                                                    : index === 1
                                                                    ? 'bg-gray-400 text-white'
                                                                    : index === 2
                                                                    ? 'bg-orange-600 text-white'
                                                                    : 'bg-muted text-muted-foreground'
                                                            }`}
                                                        >
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold">{player.name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {player.team} • €{(player.price / 1000000).toFixed(1)}M
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
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
    )
}
