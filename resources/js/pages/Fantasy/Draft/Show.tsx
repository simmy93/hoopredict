import React, { useState, useEffect } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { Button } from '@/components/ui/button'

declare global {
    interface Window {
        Echo: any;
    }
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
    league?: FantasyLeague
    userTeam?: FantasyTeam
    teams?: FantasyTeam[]
    draftPicks?: DraftPick[]
    availablePlayers?: Player[]
    currentTeam?: FantasyTeam | null
    isMyTurn?: boolean
    endTime?: number | null
    serverTime?: number
}

export default function Show({ league, userTeam, teams, draftPicks: initialDraftPicks, availablePlayers: initialAvailablePlayers, currentTeam: initialCurrentTeam, isMyTurn: initialIsMyTurn, endTime: initialEndTime, serverTime: initialServerTime }: Props) {
    const [searchQuery, setSearchQuery] = useState('')
    const [positionFilter, setPositionFilter] = useState('all')
    const [draftingPlayerId, setDraftingPlayerId] = useState<number | null>(null)
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [playerToDraft, setPlayerToDraft] = useState<Player | null>(null)

    // Live state
    const [draftPicks, setDraftPicks] = useState(initialDraftPicks || [])
    const [availablePlayers, setAvailablePlayers] = useState(initialAvailablePlayers || [])
    const [currentTeam, setCurrentTeam] = useState(initialCurrentTeam)
    const [isMyTurn, setIsMyTurn] = useState(initialIsMyTurn)
    const [currentPick, setCurrentPick] = useState(league?.current_pick || 0)
    const [isConnected, setIsConnected] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

    console.log('Draft Show props:', { league, userTeam, teams, draftPicks, availablePlayers, currentTeam, isMyTurn, endTime: initialEndTime, serverTime: initialServerTime })

    // Initialize timer on mount (like countdown example)
    useEffect(() => {
        if (initialEndTime && initialServerTime) {
            const clientNow = Date.now()
            const timeOffset = clientNow - initialServerTime
            const remaining = Math.max(0, Math.floor((initialEndTime - clientNow + timeOffset) / 1000))
            setTimeRemaining(remaining)
        }
    }, [])

    // Subscribe to draft channel
    useEffect(() => {
        if (!league) return

        const checkEcho = setInterval(() => {
            if (window.Echo) {
                clearInterval(checkEcho)
                setupEcho()
            }
        }, 100)

        const setupEcho = () => {
            console.log(`Subscribing to draft.${league.id} channel...`)
            const channel = window.Echo.channel(`draft.${league.id}`)

            channel.subscribed(() => {
                console.log('✅ Subscribed to draft channel')
                setIsConnected(true)
            })

            // Handle connection errors
            channel.error((error: any) => {
                console.error('❌ Channel connection error:', error)
                setIsConnected(false)
            })

            // Listen for player drafted events
            channel.listen('PlayerDrafted', (data: any) => {
                console.log('🔔 PlayerDrafted event received:', data)

                // Add new pick to the list
                setDraftPicks(prev => [...prev, data.pick])

                // Remove drafted player from available players
                setAvailablePlayers(prev =>
                    prev.filter(p => p.id !== data.pick.player.id)
                )

                // Update current pick number
                setCurrentPick(data.current_pick)

                // Calculate new current team
                const totalTeams = teams?.length || 0
                const currentRound = Math.ceil(data.current_pick / totalTeams)
                let positionInRound: number

                if (currentRound % 2 === 0) {
                    positionInRound = totalTeams - ((data.current_pick - 1) % totalTeams)
                } else {
                    positionInRound = ((data.current_pick - 1) % totalTeams) + 1
                }

                const newCurrentTeam = teams?.find(t => t.draft_order === positionInRound)
                setCurrentTeam(newCurrentTeam || null)
                setIsMyTurn(newCurrentTeam?.id === userTeam?.id)

                // Calculate time remaining using server time offset (like countdown)
                if (data.endTime && data.serverTime) {
                    const clientNow = Date.now()
                    const timeOffset = clientNow - data.serverTime
                    const remaining = Math.max(0, Math.floor((data.endTime - clientNow + timeOffset) / 1000))
                    setTimeRemaining(remaining)
                }

                // Reset drafting state
                setDraftingPlayerId(null)
            })

            // Listen for draft completed event
            channel.listen('DraftCompleted', (data: any) => {
                console.log('🏁 Draft completed!', data)
                // Redirect to league page after a short delay
                setTimeout(() => {
                    router.visit(`/fantasy/leagues/${league.id}`)
                }, 2000)
            })

            // Listen for draft started event
            channel.listen('DraftStarted', (data: any) => {
                console.log('🚀 Draft started!', data)
                setCurrentPick(data.current_pick)

                // Calculate time remaining using server time offset (like countdown)
                if (data.endTime && data.serverTime) {
                    const clientNow = Date.now()
                    const timeOffset = clientNow - data.serverTime
                    const remaining = Math.max(0, Math.floor((data.endTime - clientNow + timeOffset) / 1000))
                    setTimeRemaining(remaining)
                }
            })
        }

        return () => {
            clearInterval(checkEcho)
            if (window.Echo && league) {
                window.Echo.leave(`draft.${league.id}`)
            }
        }
    }, [league?.id])

    if (!league || !userTeam) {
        return (
            <AuthenticatedLayout>
                <div className="py-12 text-center">
                    <p>Loading draft data...</p>
                    <p className="text-sm text-muted-foreground mt-2">League: {league ? 'loaded' : 'missing'}, Team: {userTeam ? 'loaded' : 'missing'}</p>
                </div>
            </AuthenticatedLayout>
        )
    }

    // Client-side countdown - starts once on mount
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev === null || prev <= 0) {
                    return prev
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const handleDraftPlayer = (player: Player) => {
        if (!isMyTurn || !league) return
        setPlayerToDraft(player)
        setConfirmDialogOpen(true)
    }

    const confirmDraft = () => {
        if (!playerToDraft || !league) return

        setDraftingPlayerId(playerToDraft.id)
        setConfirmDialogOpen(false)

        router.post(`/fantasy/leagues/${league.id}/draft/pick`, {
            player_id: playerToDraft.id
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setDraftingPlayerId(null)
                setPlayerToDraft(null)
            },
            onError: () => {
                setDraftingPlayerId(null)
            }
        })
    }

    const filteredPlayers = (availablePlayers || []).filter(player => {
        const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPosition = positionFilter === 'all' || player.position === positionFilter
        return matchesSearch && matchesPosition
    })

    const positions = ['PG', 'SG', 'SF', 'PF', 'C']
    const totalTeams = teams?.length || 0
    const currentRound = Math.ceil((league?.current_pick || 0) / totalTeams)
    const totalRounds = league?.team_size || 0

    return (
        <AuthenticatedLayout>
            <Head title={`Draft Room - ${league?.name || 'Loading'}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={`/fantasy/leagues/${league?.id || ''}`} className="text-muted-foreground hover:text-foreground">
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
                                        {league?.name} - Draft Room
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        Round {currentRound} of {totalRounds} • Pick #{currentPick}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant={isConnected ? "default" : "destructive"}>
                                        {isConnected ? '🟢 Live' : '🔴 Connecting...'}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {currentTeam && (
                                <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg">
                                    <Clock className="h-5 w-5" />
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            {isMyTurn ? "It's your turn!" : `${currentTeam?.user?.name || 'Someone'} is picking...`}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {currentTeam?.team_name} (Pick #{currentPick})
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

                    {/* My Picks */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>My Picks</CardTitle>
                            <CardDescription>Your drafted players</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {(draftPicks || []).filter(pick => pick.team.id === userTeam?.id).map((pick) => (
                                    <div key={pick.id} className="flex-shrink-0 w-32 p-3 border rounded-lg bg-primary/5">
                                        <div className="text-center">
                                            {pick.player.photo_url ? (
                                                <img
                                                    src={pick.player.photo_url}
                                                    alt={pick.player.name}
                                                    className="w-20 h-20 mx-auto rounded-full object-cover object-top mb-2"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-2">
                                                    <User className="h-10 w-10 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="font-medium text-sm truncate">{pick.player.name}</div>
                                            <div className="text-xs text-muted-foreground">{pick.player.position}</div>
                                            <Badge variant="outline" className="text-xs mt-1">
                                                #{pick.pick_number}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {(draftPicks || []).filter(pick => pick.team.id === userTeam?.id).length === 0 && (
                                    <p className="text-sm text-muted-foreground py-4">No picks yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Draft Board - Horizontal */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Draft Board</CardTitle>
                            <CardDescription>All picks in order</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {(draftPicks || []).map((pick) => (
                                    <div key={pick.id} className="flex-shrink-0 w-32 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="text-center">
                                            {pick.player.photo_url ? (
                                                <img
                                                    src={pick.player.photo_url}
                                                    alt={pick.player.name}
                                                    className="w-20 h-20 mx-auto rounded-full object-cover object-top mb-2"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-2">
                                                    <User className="h-10 w-10 text-muted-foreground" />
                                                </div>
                                            )}
                                            <Badge variant="outline" className="text-xs mb-1">
                                                #{pick.pick_number}
                                            </Badge>
                                            <div className="font-medium text-sm truncate">{pick.player.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">{pick.team.team_name}</div>
                                            <div className="text-xs text-muted-foreground">{pick.player.position} • R{pick.round}</div>
                                        </div>
                                    </div>
                                ))}
                                {(draftPicks || []).length === 0 && (
                                    <p className="text-sm text-muted-foreground py-8 px-4">No picks yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Available Players */}
                    <Card className="mb-6">
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
                                            onClick={() => handleDraftPlayer(player)}
                                            disabled={!isMyTurn || draftingPlayerId !== null}
                                        >
                                            {draftingPlayerId === player.id ? 'Drafting...' : 'Draft'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

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
                                    {(teams || []).map((team) => {
                                        const teamPicks = (draftPicks || []).filter(p => p.team.id === team.id).length
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
                                                    {teamPicks}/{league?.team_size}
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

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Draft Pick</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to draft this player?
                        </DialogDescription>
                    </DialogHeader>
                    {playerToDraft && (
                        <div className="py-4">
                            <div className="flex items-center gap-3">
                                {playerToDraft.photo_url ? (
                                    <img
                                        src={playerToDraft.photo_url}
                                        alt={playerToDraft.name}
                                        className="w-16 h-16 rounded-full object-cover object-top"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                        <User className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                )}
                                <div>
                                    <div className="font-bold text-lg">{playerToDraft.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {playerToDraft.position} • {playerToDraft.team.name}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setConfirmDialogOpen(false)
                                setPlayerToDraft(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={confirmDraft}>
                            Confirm Draft
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    )
}
