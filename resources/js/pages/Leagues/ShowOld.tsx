import React, { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Crown, ArrowLeft, Copy, Trophy, Target, TrendingUp, Calendar, Clock, MapPin } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

interface User {
    id: number
    name: string
}

interface LeagueMember {
    id: number
    user: User
    role: string
    joined_at: string
}

interface LeaderboardEntry {
    id: number
    user: User
    total_points: number
    total_predictions: number
    correct_predictions: number
    accuracy_percentage: number
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
    game_id: number
    home_score_prediction: number
    away_score_prediction: number
    points_earned: number | null
    predicted_at: string
}

interface League {
    id: number
    name: string
    description: string | null
    is_private: boolean
    invite_code: string
    max_members: number
    is_active: boolean
    owner: User
    members: LeagueMember[]
    leaderboards?: LeaderboardEntry[]
}

interface Props {
    league: League
    userRole: string | null
    members: LeagueMember[]
    leaderboard: LeaderboardEntry[]
    games: Game[]
    existingPredictions: Record<string, Prediction>
}

export default function Show({ league, userRole, members, leaderboard, games, existingPredictions }: Props) {
    const { delete: destroy, processing } = useForm()
    const [selectedGame, setSelectedGame] = useState<Game | null>(null)
    const { data, setData, post, processing: predictionProcessing, errors, reset } = useForm({
        game_id: '',
        league_id: league.id,
        home_score_prediction: '',
        away_score_prediction: ''
    })

    const copyInviteCode = () => {
        navigator.clipboard.writeText(league.invite_code)
    }

    const leaveLeague = () => {
        if (confirm('Are you sure you want to leave this league?')) {
            destroy(`/leagues/${league.id}/leave`)
        }
    }

    const deleteLeague = () => {
        if (confirm('Are you sure you want to delete this league? This action cannot be undone.')) {
            destroy(`/leagues/${league.id}`)
        }
    }

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

    const canPredict = (game: Game) => {
        return game.status === 'scheduled' && new Date(game.scheduled_at) > new Date()
    }

    const openPredictionForm = (game: Game) => {
        setSelectedGame(game)
        const existingPrediction = existingPredictions[game.id.toString()]

        setData({
            game_id: game.id.toString(),
            league_id: league.id.toString(),
            home_score_prediction: existingPrediction ? existingPrediction.home_score_prediction.toString() : '',
            away_score_prediction: existingPrediction ? existingPrediction.away_score_prediction.toString() : ''
        })
    }

    const submitPrediction = (e: React.FormEvent) => {
        e.preventDefault()
        post('/predictions', {
            onSuccess: () => {
                setSelectedGame(null)
                reset()
            }
        })
    }

    const closePredictionForm = () => {
        setSelectedGame(null)
        reset()
    }

    return (
        <AuthenticatedLayout>
            <Head title={league.name} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href="/leagues" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Leagues
                        </Link>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* League Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {league.name}
                                                {userRole === 'owner' && (
                                                    <Crown className="h-4 w-4 text-yellow-600" />
                                                )}
                                            </CardTitle>
                                            {league.description && (
                                                <CardDescription className="mt-1">
                                                    {league.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {league.is_private && (
                                                <Badge variant="secondary">Private</Badge>
                                            )}
                                            <Badge variant="outline" className="font-mono">
                                                {league.invite_code}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {members.length}/{league.max_members} members
                                            </div>
                                            <div>Owner: {league.owner.name}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={copyInviteCode}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            {userRole && userRole !== 'owner' && (
                                                <Button variant="destructive" size="sm" onClick={leaveLeague} disabled={processing}>
                                                    Leave
                                                </Button>
                                            )}
                                            {userRole === 'owner' && (
                                                <Button variant="destructive" size="sm" onClick={deleteLeague} disabled={processing}>
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Leaderboard */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5" />
                                        Leaderboard
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {leaderboard.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">
                                                No predictions made yet. Start making predictions to see the leaderboard!
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {leaderboard.map((entry, index) => (
                                                <div key={entry.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{entry.user.name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {entry.correct_predictions}/{entry.total_predictions} correct
                                                                ({entry.accuracy_percentage.toFixed(1)}%)
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold">{entry.total_points}</div>
                                                        <div className="text-sm text-muted-foreground">points</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Members Sidebar */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Members ({members.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {members.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                                        {member.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{member.user.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Joined {new Date(member.joined_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                {member.role === 'owner' && (
                                                    <Crown className="h-4 w-4 text-yellow-600" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Stats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Quick Stats
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Total Members</span>
                                            <span className="font-medium">{members.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Active Predictions</span>
                                            <span className="font-medium">0</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Games This Week</span>
                                            <span className="font-medium">0</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}