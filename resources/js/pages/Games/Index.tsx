import React from 'react'
import { Head, Link } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Trophy } from 'lucide-react'
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

interface Props {
    upcomingGames: Game[]
    userLeagues: League[]
}

export default function Index({ upcomingGames, userLeagues }: Props) {
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

    return (
        <AuthenticatedLayout>
            <Head title="Games" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Upcoming Games</h2>
                            <p className="text-muted-foreground mt-1">
                                Make your predictions for EuroLeague games
                            </p>
                        </div>
                        {userLeagues.length === 0 && (
                            <Link href="/leagues/create">
                                <Button>Create a League First</Button>
                            </Link>
                        )}
                    </div>

                    {userLeagues.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Join a League to Start Predicting</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    You need to be part of at least one league to make predictions
                                </p>
                                <div className="flex gap-2">
                                    <Link href="/leagues/create">
                                        <Button>Create League</Button>
                                    </Link>
                                    <Link href="/leagues">
                                        <Button variant="outline">View Leagues</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ) : upcomingGames.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Upcoming Games</h3>
                                <p className="text-muted-foreground text-center">
                                    Check back later for new games to predict
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {upcomingGames.map((game) => {
                                const { date, time } = formatDateTime(game.scheduled_at)
                                return (
                                    <Card key={game.id} className="hover:shadow-md transition-shadow">
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
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    {date}
                                                    <Clock className="h-4 w-4" />
                                                    {time}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center space-x-4">
                                                    {/* Home Team */}
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                                                            {game.home_team.name.split(' ')[0].substring(0, 3).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold">{game.home_team.name}</div>
                                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {game.home_team.city}, {game.home_team.country}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-2xl font-bold text-muted-foreground">
                                                        VS
                                                    </div>

                                                    {/* Away Team */}
                                                    <div className="flex items-center space-x-3">
                                                        <div>
                                                            <div className="font-semibold text-right">{game.away_team.name}</div>
                                                            <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                                                                <MapPin className="h-3 w-3" />
                                                                {game.away_team.city}, {game.away_team.country}
                                                            </div>
                                                        </div>
                                                        <div className="w-12 h-12 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-bold">
                                                            {game.away_team.name.split(' ')[0].substring(0, 3).toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end">
                                                <Link href={`/games/${game.id}`}>
                                                    <Button>Make Prediction</Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}