import React, { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, ShoppingCart, Share2, Copy, Check } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

interface User {
    id: number
    name: string
}

interface Championship {
    id: number
    name: string
    season: string
}

interface Player {
    id: number
    name: string
    position: string
    price: number
    photo_url: string | null
}

interface FantasyTeam {
    id: number
    team_name: string
    budget_spent: number
    budget_remaining: number
    total_points: number
    user: User
    players?: Player[]
}

interface FantasyLeague {
    id: number
    name: string
    description: string
    mode: 'budget' | 'draft'
    budget: number
    team_size: number
    is_private: boolean
    max_members: number
    owner_id: number
    owner: User
    championship: Championship
    teams: FantasyTeam[]
}

interface Props {
    league: FantasyLeague
    userTeam: FantasyTeam | null
    leaderboard: FantasyTeam[]
    inviteUrl: string
}

export default function Show({ league, userTeam, leaderboard, inviteUrl }: Props) {
    const [copied, setCopied] = useState(false)

    const copyInviteUrl = () => {
        navigator.clipboard.writeText(inviteUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <AuthenticatedLayout>
            <Head title={league.name} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href="/fantasy/leagues" className="text-muted-foreground hover:text-foreground">
                            ← Back to Fantasy Leagues
                        </Link>
                    </div>

                    {/* League Header */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-3xl flex items-center gap-3">
                                        <Trophy className="h-8 w-8" />
                                        {league.name}
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        {league.championship.name} - {league.championship.season}
                                    </CardDescription>
                                </div>
                                <Badge variant={league.mode === 'budget' ? 'default' : 'secondary'}>
                                    {league.mode === 'budget' ? 'Budget Mode' : 'Draft Mode'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {league.description && (
                                <p className="text-muted-foreground mb-4">{league.description}</p>
                            )}

                            <div className="flex flex-wrap gap-6 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Owner:</span>{' '}
                                    <span className="font-medium">{league.owner.name}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Members:</span>{' '}
                                    <span className="font-medium">{league.teams.length}/{league.max_members}</span>
                                </div>
                                {league.mode === 'budget' && (
                                    <div>
                                        <span className="text-muted-foreground">Starting Budget:</span>{' '}
                                        <span className="font-medium">${(league.budget / 1000000).toFixed(0)}M</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-muted-foreground">Team Size:</span>{' '}
                                    <span className="font-medium">{league.team_size} players</span>
                                </div>
                            </div>

                            {/* Invite URL */}
                            <div className="mt-6 flex gap-2">
                                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                                    <Share2 className="h-4 w-4 text-muted-foreground" />
                                    <code className="flex-1 text-sm">{inviteUrl}</code>
                                </div>
                                <Button variant="outline" onClick={copyInviteUrl}>
                                    {copied ? (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* My Team */}
                        {userTeam && (
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>My Team</span>
                                        <Link href={`/fantasy/leagues/${league.id}/team`}>
                                            <Button size="sm">
                                                <ShoppingCart className="h-4 w-4 mr-2" />
                                                View Team
                                            </Button>
                                        </Link>
                                    </CardTitle>
                                    <CardDescription>{userTeam.team_name}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Total Points</span>
                                            <span className="text-2xl font-bold text-primary">
                                                {userTeam.total_points.toFixed(1)}
                                            </span>
                                        </div>

                                        {league.mode === 'budget' && (
                                            <>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground">Budget Spent</span>
                                                    <span className="font-medium">
                                                        ${(userTeam.budget_spent / 1000000).toFixed(1)}M
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground">Budget Remaining</span>
                                                    <span className="font-medium text-green-600">
                                                        ${(userTeam.budget_remaining / 1000000).toFixed(1)}M
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Players</span>
                                            <span className="font-medium">
                                                {userTeam.players?.length || 0}/{league.team_size}
                                            </span>
                                        </div>
                                    </div>

                                    {userTeam.players && userTeam.players.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="font-medium mb-3">My Players</h4>
                                            <div className="space-y-2">
                                                {userTeam.players.map((player) => (
                                                    <div key={player.id} className="flex items-center gap-2 text-sm">
                                                        {player.photo_url ? (
                                                            <img
                                                                src={player.photo_url}
                                                                alt={player.name}
                                                                className="w-8 h-8 rounded-full object-cover object-top"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                                                                {player.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="font-medium">{player.name}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {player.position}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            ${(player.price / 1000000).toFixed(1)}M
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Leaderboard */}
                        <Card className={userTeam ? 'lg:col-span-2' : 'lg:col-span-3'}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5" />
                                    Leaderboard
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">Rank</TableHead>
                                            <TableHead>Team</TableHead>
                                            <TableHead>Manager</TableHead>
                                            <TableHead className="text-right">Points</TableHead>
                                            {league.mode === 'budget' && (
                                                <>
                                                    <TableHead className="text-right">Spent</TableHead>
                                                    <TableHead className="text-right">Remaining</TableHead>
                                                </>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leaderboard.map((team, index) => (
                                            <TableRow
                                                key={team.id}
                                                className={userTeam?.id === team.id ? 'bg-primary/5' : ''}
                                            >
                                                <TableCell className="font-medium">
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                                                </TableCell>
                                                <TableCell className="font-medium">{team.team_name}</TableCell>
                                                <TableCell>{team.user.name}</TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {team.total_points.toFixed(1)}
                                                </TableCell>
                                                {league.mode === 'budget' && (
                                                    <>
                                                        <TableCell className="text-right">
                                                            ${(team.budget_spent / 1000000).toFixed(1)}M
                                                        </TableCell>
                                                        <TableCell className="text-right text-green-600">
                                                            ${(team.budget_remaining / 1000000).toFixed(1)}M
                                                        </TableCell>
                                                    </>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
