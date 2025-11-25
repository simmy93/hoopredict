import React from 'react'
import { Head, Link } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, Target, Calendar, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react'
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
    logo_url: string | null
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
    game: Game
}

interface League {
    id: number
    name: string
    description: string | null
}

interface Props {
    league: League
    user: User
    predictions: Prediction[]
    userRole: string | null
}

export default function UserPredictions({ league, user, predictions, userRole }: Props) {
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

    const getPredictionResult = (prediction: Prediction) => {
        if (prediction.points_earned === null) {
            return { status: 'pending', label: 'Pending', points: 0 }
        }

        if (prediction.points_earned > 0) {
            return { status: 'correct', label: `+${prediction.points_earned} pts`, points: prediction.points_earned }
        } else {
            return { status: 'incorrect', label: '0 pts', points: 0 }
        }
    }

    const getTotalPoints = () => {
        return predictions.reduce((sum, prediction) => sum + (prediction.points_earned || 0), 0)
    }

    const getCorrectPredictions = () => {
        return predictions.filter(p => (p.points_earned || 0) > 0).length
    }

    return (
        <AuthenticatedLayout>
            <Head title={`${user.name}'s Predictions - ${league.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={`/leagues/${league.id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to {league.name}
                        </Link>
                    </div>

                    {/* Header */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div>{user.name}'s Predictions</div>
                                            <CardDescription className="mt-1">
                                                In {league.name}
                                            </CardDescription>
                                        </div>
                                    </CardTitle>
                                </div>
                                <div className="flex gap-4 text-center">
                                    <div className="text-sm">
                                        <div className="text-2xl font-bold text-primary">{getTotalPoints()}</div>
                                        <div className="text-muted-foreground">Total Points</div>
                                    </div>
                                    <div className="text-sm">
                                        <div className="text-2xl font-bold text-green-600">{getCorrectPredictions()}</div>
                                        <div className="text-muted-foreground">Correct</div>
                                    </div>
                                    <div className="text-sm">
                                        <div className="text-2xl font-bold text-muted-foreground">{predictions.length}</div>
                                        <div className="text-muted-foreground">Total</div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Predictions */}
                    <div className="space-y-4">
                        {predictions.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Target className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Predictions Visible</h3>
                                    <p className="text-muted-foreground text-center">
                                        This user hasn't made any predictions for started or finished games yet.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            predictions.map((prediction) => {
                                const { date, time } = formatDateTime(prediction.game.scheduled_at)
                                const result = getPredictionResult(prediction)
                                const actualScore = prediction.game.home_score !== null && prediction.game.away_score !== null

                                return (
                                    <Card key={prediction.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge variant="outline">
                                                        {prediction.game.championship.name}
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        Round {prediction.game.round}
                                                    </Badge>
                                                    <Badge
                                                        variant={result.status === 'correct' ? 'default' : result.status === 'incorrect' ? 'destructive' : 'secondary'}
                                                        className={result.status === 'correct' ? 'bg-green-600' : ''}
                                                    >
                                                        {result.status === 'correct' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                        {result.status === 'incorrect' && <XCircle className="h-3 w-3 mr-1" />}
                                                        {result.label}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        {date}
                                                        <Clock className="h-4 w-4" />
                                                        {time}
                                                    </div>
                                                    <Link
                                                        href={`/leagues/${league.id}/games/${prediction.game.id}/predictions`}
                                                        className="text-primary hover:text-primary/80 text-sm font-medium"
                                                        title="View all predictions for this game"
                                                    >
                                                        View All →
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {/* Teams Display */}
                                            <div className="flex items-center justify-center space-x-8 mb-6">
                                                {/* Home Team */}
                                                <div className="flex flex-col items-center space-y-3 flex-1 max-w-xs">
                                                    <div className="w-16 h-16 flex items-center justify-center">
                                                        {prediction.game.home_team.logo_url ? (
                                                            <img
                                                                src={prediction.game.home_team.logo_url}
                                                                alt={prediction.game.home_team.name}
                                                                className="h-16 w-16 object-contain"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold">
                                                                {prediction.game.home_team.name.split(' ')[0].substring(0, 3).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-lg">{prediction.game.home_team.name}</div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                                                            <MapPin className="h-3 w-3" />
                                                            {prediction.game.home_team.city}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-3xl font-bold text-muted-foreground">
                                                    VS
                                                </div>

                                                {/* Away Team */}
                                                <div className="flex flex-col items-center space-y-3 flex-1 max-w-xs">
                                                    <div className="w-16 h-16 flex items-center justify-center">
                                                        {prediction.game.away_team.logo_url ? (
                                                            <img
                                                                src={prediction.game.away_team.logo_url}
                                                                alt={prediction.game.away_team.name}
                                                                className="h-16 w-16 object-contain"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-lg font-bold">
                                                                {prediction.game.away_team.name.split(' ')[0].substring(0, 3).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-lg">{prediction.game.away_team.name}</div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                                                            <MapPin className="h-3 w-3" />
                                                            {prediction.game.away_team.city}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Scores */}
                                            <div className="space-y-4">
                                                {/* Predicted Score */}
                                                <div className="text-center">
                                                    <div className="text-sm font-medium text-muted-foreground mb-2">Predicted Score</div>
                                                    <div className="text-3xl font-bold">
                                                        {prediction.home_score_prediction} - {prediction.away_score_prediction}
                                                    </div>
                                                </div>

                                                {/* Actual Score (if available) */}
                                                {actualScore && (
                                                    <div className="text-center border-t pt-4">
                                                        <div className="text-sm font-medium text-muted-foreground mb-2">Actual Score</div>
                                                        <div className="text-2xl font-bold text-green-700">
                                                            {prediction.game.home_score} - {prediction.game.away_score}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Prediction Date */}
                                            <div className="text-center mt-4 pt-4 border-t">
                                                <div className="text-xs text-muted-foreground">
                                                    Predicted on {new Date(prediction.predicted_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}