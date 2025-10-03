import React, { useState, useEffect } from 'react'
import { Head, Link, useForm, router } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trophy, Clock, User, Search } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

interface User {
    id: number
    name: string
}

interface Team {
    id: number
    name: string
}

interface Player {
    id: number
    name: string
    position: string
    price: number
    photo_url: string | null
    team: Team
}

interface Championship {
    id: number
    name: string
    season: string
}

interface FantasyTeam {
    id: number
    team_name: string
    draft_order: number
    user: User
}

interface FantasyLeague {
    id: number
    name: string
    mode: 'draft'
    team_size: number
    current_pick: number
    draft_status: 'in_progress' | 'completed'
    owner: User
    championship: Championship
}

interface DraftPick {
    id: number
    pick_number: number
    round: number
    player: Player
    team: FantasyTeam
}

interface Props {
    league: FantasyLeague
    userTeam: FantasyTeam
    teams: FantasyTeam[]
    draftPicks: DraftPick[]
    availablePlayers: Player[]
    currentTeam: FantasyTeam | null
    isMyTurn: boolean
    timeRemaining: number | null
}

export default function Show({ league, userTeam, teams, draftPicks, availablePlayers, currentTeam, isMyTurn, timeRemaining: initialTimeRemaining }: Props) {
    const [searchQuery, setSearchQuery] = useState('')
    const [positionFilter, setPositionFilter] = useState('all')
    const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining)
    const { data, setData, post, processing } = useForm({
        player_id: '',
    })

    // Update timer every second
    useEffect(() => {
        if (timeRemaining === null || timeRemaining === 0) return

        const interval = setInterval(() => {
            setTimeRemaining(prev => prev !== null && prev > 0 ? prev - 1 : 0)
        }, 1000)

        return () => clearInterval(interval)
    }, [timeRemaining])

    // Sync timeRemaining when prop changes
    useEffect(() => {
        setTimeRemaining(initialTimeRemaining)
    }, [initialTimeRemaining])

    // Auto-refresh every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['draftPicks', 'availablePlayers', 'currentTeam', 'isMyTurn', 'league', 'timeRemaining'] })
        }, 3000)

        return () => clearInterval(interval)
    }, [])

    const handleDraftPlayer = (playerId: number) => {
        if (!isMyTurn) return

        if (confirm('Are you sure you want to draft this player?')) {
            post(`/fantasy/leagues/${league.id}/draft/pick`, {
                data: { player_id: playerId },
                preserveScroll: true,
            })
        }
    }

    const filteredPlayers = availablePlayers.filter(player => {
        const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPosition = positionFilter === 'all' || player.position === positionFilter
        return matchesSearch && matchesPosition
    })

    const positions = ['PG', 'SG', 'SF', 'PF', 'C']
    const totalTeams = teams.length
    const currentRound = Math.ceil(league.current_pick / totalTeams)
    const totalRounds = league.team_size

    return (
        <AuthenticatedLayout>
            <Head title={`Draft Room - ${league.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={`/fantasy/leagues/${league.id}`} className="text-muted-foreground hover:text-foreground">
                            ← Back to League
                        </Link>
                    </div>

                    {/* Draft Header */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl flex items-center gap-3">
                                        <Trophy className="h-6 w-6" />
                                        {league.name} - Draft Room
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        Round {currentRound} of {totalRounds} • Pick #{league.current_pick}
                                    </CardDescription>
                                </div>
                                <Badge variant="default">Live Draft</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {currentTeam && (
                                <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg">
                                    <Clock className="h-5 w-5" />
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            {isMyTurn ? "It's your turn!" : `${currentTeam.user.name} is picking...`}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {currentTeam.team_name} (Pick #{league.current_pick})
                                        </p>
                                    </div>
                                    {timeRemaining !== null && (
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold ${
                                                timeRemaining <= 10 ? 'text-red-600' :
                                                timeRemaining <= 30 ? 'text-yellow-600' :
                                                'text-green-600'
                                            }`}>
                                                {timeRemaining}s
                                            </div>
                                            <div className="text-xs text-muted-foreground">remaining</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Available Players */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Available Players</CardTitle>
                                <CardDescription>
                                    {isMyTurn ? 'Select a player to draft' : 'Waiting for your turn...'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Filters */}
                                <div className="flex gap-2 mb-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search players..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <Select value={positionFilter} onValueChange={setPositionFilter}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Positions</SelectItem>
                                            {positions.map(pos => (
                                                <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Players List */}
                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                    {filteredPlayers.map((player) => (
                                        <div
                                            key={player.id}
                                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            {player.photo_url ? (
                                                <img
                                                    src={player.photo_url}
                                                    alt={player.name}
                                                    className="w-12 h-12 rounded-full object-cover object-top"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                                    <User className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="font-medium">{player.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {player.position} • {player.team.name}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleDraftPlayer(player.id)}
                                                disabled={!isMyTurn || processing}
                                            >
                                                {processing ? 'Drafting...' : 'Draft'}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Draft Board */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Draft Board</CardTitle>
                                <CardDescription>Recent picks</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                    {draftPicks.slice().reverse().map((pick) => (
                                        <div key={pick.id} className="p-3 border rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    #{pick.pick_number}
                                                </Badge>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{pick.player.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {pick.team.team_name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {pick.player.position} • Round {pick.round}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {draftPicks.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No picks yet
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Draft Order */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Draft Order</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Team</TableHead>
                                        <TableHead>Manager</TableHead>
                                        <TableHead className="text-right">Players Drafted</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teams.map((team) => {
                                        const teamPicks = draftPicks.filter(p => p.team.id === team.id).length
                                        const isCurrentPick = currentTeam?.id === team.id

                                        return (
                                            <TableRow
                                                key={team.id}
                                                className={isCurrentPick ? 'bg-primary/10' : ''}
                                            >
                                                <TableCell className="font-medium">
                                                    {isCurrentPick && <Clock className="inline h-4 w-4 mr-2" />}
                                                    {team.draft_order}
                                                </TableCell>
                                                <TableCell>{team.team_name}</TableCell>
                                                <TableCell>{team.user.name}</TableCell>
                                                <TableCell className="text-right">
                                                    {teamPicks}/{league.team_size}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
