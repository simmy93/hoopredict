import React, { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Calendar, Clock, MapPin, Trophy, Target } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

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
    home_team: Team
    away_team: Team
    championship: Championship
}

interface League {
    id: number
    name: string
}

interface Prediction {
    id: number
    league_id: number
    home_score_prediction: number
    away_score_prediction: number
    predicted_at: string
}

interface Props {
    game: Game
    userLeagues: League[]
    existingPredictions: Record<string, Prediction>
}

export default function Show({ game, userLeagues, existingPredictions }: Props) {
    const [selectedLeague, setSelectedLeague] = useState<string>('')

    const { data, setData, post, processing, errors } = useForm({
        game_id: game.id,
        league_id: '',
        home_score_prediction: '',
        away_score_prediction: ''
    })

    const formatDateTime = (dateTime: string) => {
        const date = new Date(dateTime)
        return {
            date: date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            })
        }
    }

    const { date, time } = formatDateTime(game.scheduled_at)
    const gameTime = new Date(game.scheduled_at)
    const canPredict = gameTime > new Date()

    const handleLeagueChange = (leagueId: string) => {
        setSelectedLeague(leagueId)
        setData('league_id', leagueId)

        // Pre-fill with existing prediction if available
        const existingPrediction = existingPredictions[leagueId]
        if (existingPrediction) {
            setData({
                ...data,
                league_id: leagueId,
                home_score_prediction: existingPrediction.home_score_prediction.toString(),
                away_score_prediction: existingPrediction.away_score_prediction.toString()
            })
        } else {
            setData({
                ...data,
                league_id: leagueId,
                home_score_prediction: '',
                away_score_prediction: ''
            })
        }
    }

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        post('/predictions')
    }

    const existingPrediction = selectedLeague ? existingPredictions[selectedLeague] : null

    return (
        <AuthenticatedLayout>
            <Head title={`${game.home_team.name} vs ${game.away_team.name}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href="/games" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Games
                        </Link>
                    </div>

                    <div className="space-y-6">
                        {/* Game Info */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                            {game.championship.name}
                                        </Badge>
                                        <Badge variant="secondary">
                                            Round {game.round}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {date}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {time}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center space-x-8">
                                    {/* Home Team */}
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                                            {game.home_team.name.split(' ')[0].substring(0, 3).toUpperCase()}
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-lg">{game.home_team.name}</div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {game.home_team.city}, {game.home_team.country}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-4xl font-bold text-muted-foreground">
                                        VS
                                    </div>

                                    {/* Away Team */}
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className="w-20 h-20 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                                            {game.away_team.name.split(' ')[0].substring(0, 3).toUpperCase()}
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-lg">{game.away_team.name}</div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {game.away_team.city}, {game.away_team.country}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Prediction Form */}
                        {canPredict ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        Make Your Prediction
                                    </CardTitle>
                                    <CardDescription>
                                        Select a league and predict the final score
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={submit} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="league">Select League *</Label>
                                            <Select value={selectedLeague} onValueChange={handleLeagueChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose a league to predict in" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {userLeagues.map((league) => (
                                                        <SelectItem key={league.id} value={league.id.toString()}>
                                                            {league.name}
                                                            {existingPredictions[league.id.toString()] && (
                                                                <span className="ml-2 text-xs text-muted-foreground">
                                                                    (has prediction)
                                                                </span>
                                                            )}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.league_id && <p className="text-sm text-red-600">{errors.league_id}</p>}
                                        </div>

                                        {selectedLeague && (
                                            <>
                                                {existingPrediction && (
                                                    <div className="p-3 bg-muted rounded-lg">
                                                        <p className="text-sm text-muted-foreground">
                                                            You already have a prediction for this game in this league.
                                                            Submitting will update your existing prediction.
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="home_score">
                                                            {game.home_team.name} Score *
                                                        </Label>
                                                        <Input
                                                            id="home_score"
                                                            type="number"
                                                            min="0"
                                                            max="200"
                                                            value={data.home_score_prediction}
                                                            onChange={(e) => setData('home_score_prediction', e.target.value)}
                                                            placeholder="0"
                                                            className={errors.home_score_prediction ? 'border-red-500' : ''}
                                                        />
                                                        {errors.home_score_prediction && (
                                                            <p className="text-sm text-red-600">{errors.home_score_prediction}</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="away_score">
                                                            {game.away_team.name} Score *
                                                        </Label>
                                                        <Input
                                                            id="away_score"
                                                            type="number"
                                                            min="0"
                                                            max="200"
                                                            value={data.away_score_prediction}
                                                            onChange={(e) => setData('away_score_prediction', e.target.value)}
                                                            placeholder="0"
                                                            className={errors.away_score_prediction ? 'border-red-500' : ''}
                                                        />
                                                        {errors.away_score_prediction && (
                                                            <p className="text-sm text-red-600">{errors.away_score_prediction}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <Button type="submit" disabled={processing} className="w-full">
                                                    {processing ? 'Saving...' : existingPrediction ? 'Update Prediction' : 'Save Prediction'}
                                                </Button>
                                            </>
                                        )}
                                    </form>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Predictions Closed</h3>
                                    <p className="text-muted-foreground text-center">
                                        This game has already started. Predictions are no longer accepted.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}