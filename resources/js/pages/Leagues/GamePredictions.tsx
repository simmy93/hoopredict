import React from 'react'
import { Head, Link } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, Calendar, Clock, MapPin, Crown, CheckCircle, XCircle, Minus } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

interface User {
    id: number
    name: string
    email: string
}

interface Team {
    id: number
    name: string
    city: string
    country: string
}

interface Championship {
    id: number
    name: string
    season: string
}

interface Game {
    id: number
    scheduled_at: string
    status: string
    round: number
    home_score: number | null
    away_score: number | null
    home_team: Team
    away_team: Team
    championship: Championship
}

interface Prediction {
    id: number
    home_score_prediction: number
    away_score_prediction: number
    points_earned: number | null
    predicted_at: string
}

interface League {
    id: number
    name: string
    description: string | null
}

interface MemberPrediction {
    user: User
    prediction: Prediction | null
    role: string
    joined_at: string
}

interface Props {
    league: League
    game: Game
    predictions: MemberPrediction[]
    gameStarted: boolean
    userRole: string | null
}

export default function GamePredictions({ league, game, predictions, gameStarted, userRole }: Props) {
    const formatDateTime = (dateTime: string) => {
        const date = new Date(dateTime)
        return {
            date: date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            })
        }
    }

    const { date, time } = formatDateTime(game.scheduled_at)

    const getPredictionBadge = (prediction: Prediction | null) => {
        if (!prediction || prediction.points_earned === null) {
            return null
        }

        if (prediction.points_earned > 0) {
            return (
                <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    +{prediction.points_earned} pts
                </Badge>
            )
        } else {
            return (
                <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    0 pts
                </Badge>
            )
        }
    }

    const getActualScore = () => {
        return game.home_score !== null && game.away_score !== null
    }

    return (
        <AuthenticatedLayout>
            <Head title={`${game.home_team.name} vs ${game.away_team.name} - ${league.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={`/leagues/${league.id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to {league.name}
                        </Link>
                    </div>

                    {/* Game Header */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                        {game.championship.name}
                                    </Badge>
                                    <Badge variant="secondary">
                                        Round {game.round}
                                    </Badge>
                                    <Badge variant={game.status === 'finished' ? 'default' : 'secondary'}>
                                        {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {date}
                                    <Clock className="h-4 w-4" />
                                    {time}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Teams Display */}
                            <div className="flex items-center justify-center space-x-8 mb-6">
                                {/* Home Team */}
                                <div className="flex flex-col items-center space-y-3 flex-1 max-w-xs">
                                    <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold">
                                        {game.home_team.name.split(' ')[0].substring(0, 3).toUpperCase()}
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg">{game.home_team.name}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                                            <MapPin className="h-3 w-3" />
                                            {game.home_team.city}
                                        </div>
                                    </div>
                                </div>

                                {/* Score Display */}
                                <div className="text-center">
                                    {getActualScore() ? (
                                        <>
                                            <div className="text-4xl font-bold mb-2">
                                                {game.home_score} - {game.away_score}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Final Score</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-3xl font-bold text-muted-foreground mb-2">
                                                VS
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {gameStarted ? 'In Progress' : 'Upcoming'}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Away Team */}
                                <div className="flex flex-col items-center space-y-3 flex-1 max-w-xs">
                                    <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-lg font-bold">
                                        {game.away_team.name.split(' ')[0].substring(0, 3).toUpperCase()}
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg">{game.away_team.name}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                                            <MapPin className="h-3 w-3" />
                                            {game.away_team.city}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Predictions Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5" />
                                League Predictions
                                {!gameStarted && (
                                    <Badge variant="secondary" className="ml-2">
                                        Hidden until game starts
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {gameStarted
                                    ? `All predictions for this game, sorted by points earned`
                                    : `League members who will be competing once the game starts`
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {predictions.length === 0 ? (
                                <div className="text-center py-8">
                                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">
                                        No league members found for this game.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-2 font-medium">Rank</th>
                                                <th className="text-left py-3 px-2 font-medium">Player</th>
                                                {gameStarted && (
                                                    <>
                                                        <th className="text-center py-3 px-2 font-medium">Prediction</th>
                                                        <th className="text-center py-3 px-2 font-medium">Points</th>
                                                        <th className="text-center py-3 px-2 font-medium">Result</th>
                                                    </>
                                                )}
                                                {!gameStarted && (
                                                    <th className="text-center py-3 px-2 font-medium">Status</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {predictions.map((entry, index) => (
                                                <tr key={entry.user.id} className="border-b hover:bg-muted/50">
                                                    <td className="py-3 px-2">
                                                        {gameStarted && entry.prediction ? (
                                                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                                                {index + 1}
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm">
                                                                <Minus className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                                                {entry.user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium flex items-center gap-2">
                                                                    <Link
                                                                        href={`/leagues/${league.id}/users/${entry.user.id}/predictions`}
                                                                        className="hover:text-primary cursor-pointer hover:underline"
                                                                    >
                                                                        {entry.user.name}
                                                                    </Link>
                                                                    {entry.role === 'owner' && (
                                                                        <Crown className="h-4 w-4 text-yellow-600" />
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="text-sm text-muted-foreground">
                                                                        {entry.role.charAt(0).toUpperCase() + entry.role.slice(1)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {gameStarted && (
                                                        <>
                                                            <td className="py-3 px-2 text-center">
                                                                {entry.prediction ? (
                                                                    <div className="font-mono text-lg font-semibold">
                                                                        {entry.prediction.home_score_prediction} - {entry.prediction.away_score_prediction}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-muted-foreground">
                                                                        No prediction
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-2 text-center">
                                                                <div className="text-lg font-bold">
                                                                    {entry.prediction?.points_earned ?? 0}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-2 text-center">
                                                                {getPredictionBadge(entry.prediction)}
                                                            </td>
                                                        </>
                                                    )}
                                                    {!gameStarted && (
                                                        <td className="py-3 px-2 text-center">
                                                            <Badge variant="outline">
                                                                Ready to predict
                                                            </Badge>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Info Card for upcoming games */}
                    {!gameStarted && (
                        <Card className="mt-6 border-blue-200 bg-blue-50/50">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-blue-900 mb-1">Game hasn't started yet</h4>
                                        <p className="text-sm text-blue-700">
                                            Predictions and points will be visible once the game begins on {date} at {time}.
                                            This ensures fair play and prevents users from copying each other's predictions.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}