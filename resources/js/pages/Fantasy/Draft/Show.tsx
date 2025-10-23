import { useState, useEffect, useCallback } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trophy, Clock, User, Search, Pause, Play, History, Loader2 } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import axios from 'axios'

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
    pick_time_limit: number
    owner: User
    championship: Championship
    is_paused: boolean
    paused_at: string | null
    paused_by: User | null
    pause_time_remaining: number | null
}

interface DraftPick {
    id: number
    pick_number: number
    round: number
    player: Player
    team: FantasyTeam
}

interface PaginationMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

interface Props {
    league?: FantasyLeague
    userTeam?: FantasyTeam
    teams?: FantasyTeam[]
    draftPicks?: DraftPick[]
    availablePlayersCount?: number
    draftedPlayerIds?: number[]
    currentTeam?: FantasyTeam | null
    isMyTurn?: boolean
    endTime?: number | null
    serverTime?: number
    canPauseResume?: boolean
}

export default function Show({
    league,
    userTeam,
    teams,
    draftPicks: initialDraftPicks,
    availablePlayersCount,
    draftedPlayerIds: initialDraftedPlayerIds,
    currentTeam: initialCurrentTeam,
    isMyTurn: initialIsMyTurn,
    endTime: initialEndTime,
    serverTime: initialServerTime,
    canPauseResume
}: Props) {
    const [searchQuery, setSearchQuery] = useState('')
    const [positionFilter, setPositionFilter] = useState('all')
    const [draftingPlayerId, setDraftingPlayerId] = useState<number | null>(null)
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [playerToDraft, setPlayerToDraft] = useState<Player | null>(null)

    // Live state
    const [draftPicks, setDraftPicks] = useState(initialDraftPicks || [])
    const [draftedPlayerIds, setDraftedPlayerIds] = useState<number[]>(initialDraftedPlayerIds || [])
    const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)
    const [playersPagination, setPlayersPagination] = useState<PaginationMeta | null>(null)
    const [currentTeam, setCurrentTeam] = useState(initialCurrentTeam)
    const [isMyTurn, setIsMyTurn] = useState(initialIsMyTurn)
    const [currentPick, setCurrentPick] = useState(league?.current_pick || 0)
    const [isConnected, setIsConnected] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
    const [isPaused, setIsPaused] = useState(league?.is_paused || false)
    const [pausedBy, setPausedBy] = useState<User | null>(league?.paused_by || null)
    const [isPausing, setIsPausing] = useState(false)
    const [isResuming, setIsResuming] = useState(false)

    // Fetch available players from API
    const fetchPlayers = useCallback(async (page: number = 1, search?: string, position?: string) => {
        if (!league) return

        setIsLoadingPlayers(true)
        try {
            const params: any = { page, per_page: 20 }
            if (search) params.search = search
            if (position && position !== 'all') params.position = position

            const response = await axios.get(`/fantasy/leagues/${league.id}/draft/available-players`, { params })

            if (page === 1) {
                // First page - replace all players
                setAvailablePlayers(response.data.data)
            } else {
                // Subsequent pages - append
                setAvailablePlayers(prev => [...prev, ...response.data.data])
            }

            setPlayersPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                per_page: response.data.per_page,
                total: response.data.total,
            })
        } catch (error) {
            console.error('Failed to fetch players:', error)
        } finally {
            setIsLoadingPlayers(false)
        }
    }, [league?.id])

    // Initial fetch on mount
    useEffect(() => {
        fetchPlayers(1)
    }, [fetchPlayers])

    // Refetch when search or filter changes
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchPlayers(1, searchQuery, positionFilter)
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery, positionFilter, fetchPlayers])

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission)
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    setNotificationPermission(permission)
                })
            }
        }
    }, [])

    // Play sound and show notification when it's user's turn
    useEffect(() => {
        if (isMyTurn && Notification.permission === 'granted') {
            // Show browser notification
            const notification = new Notification("It's Your Turn to Draft! 🏀", {
                body: `Pick #${currentPick} in ${league?.name}. Make your selection now!`,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'draft-turn',
                requireInteraction: true,
            })

            // Play a sound (you can add an audio file)
            try {
                const audio = new Audio('/sounds/notification.mp3')
                audio.play().catch(() => {
                    // Ignore if sound fails to play
                })
            } catch (e) {
                // Ignore if audio not available
            }

            notification.onclick = () => {
                window.focus()
                notification.close()
            }
        }
    }, [isMyTurn, currentPick])

    // Initialize timer on mount or when draft is paused/resumed
    useEffect(() => {
        if (!league) return
        if (league.is_paused) {
            setTimeRemaining(league.pause_time_remaining)
            return
        }

        if (initialEndTime && initialServerTime) {
            const clientNow = Date.now()
            const timeOffset = clientNow - initialServerTime
            const remaining = Math.max(0, Math.floor((initialEndTime - clientNow + timeOffset) / 1000))
            setTimeRemaining(remaining)
        }
    }, [league?.is_paused, league?.pause_time_remaining, initialEndTime, initialServerTime])

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
            console.log(`Subscribing to draft.${league.id} private channel...`)
            console.log('Echo instance:', window.Echo)

            const channel = window.Echo.private(`draft.${league.id}`)
            console.log('Channel created:', channel)

            channel.subscribed(() => {
                console.log('✅ Subscribed to draft channel successfully')
                setIsConnected(true)
            })

            // Handle connection errors
            channel.error((error: any) => {
                console.error('❌ Channel connection error:', error)
                setIsConnected(false)
            })

            // Additional error handling
            channel.subscription.bind('pusher:subscription_error', (status: any) => {
                console.error('❌ Subscription error:', status)
            })

            channel.subscription.bind('pusher:subscription_succeeded', () => {
                console.log('✅ Pusher subscription succeeded')
            })

            // Debug: Log ALL events on this channel (only in development)
            if (import.meta.env.DEV) {
                channel.subscription.bind_global((eventName: string, data: any) => {
                    console.log('🔊 Event received:', eventName, data)
                })
            }

            // Listen for player drafted events
            channel.listen('PlayerDrafted', (data: any) => {
                console.log('🔔 PlayerDrafted event received:', data)

                // Add new pick to the list
                setDraftPicks(prev => [...prev, data.pick])

                // Add to drafted player IDs and remove from available players
                setDraftedPlayerIds(prev => [...prev, data.pick.player.id])
                setAvailablePlayers(prev => prev.filter(p => p.id !== data.pick.player.id))

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

            // Listen for draft paused event (using broadcastAs name with dot prefix for private channel)
            channel.listen('.draft.paused', (data: any) => {
                console.log('⏸️ Draft paused!', data)
                setIsPaused(true)
                setPausedBy(data.paused_by)
                setTimeRemaining(data.time_remaining)
            })

            // Listen for draft resumed event (using broadcastAs name with dot prefix for private channel)
            channel.listen('.draft.resumed', (data: any) => {
                console.log('▶️ Draft resumed!', data)
                setIsPaused(false)
                setPausedBy(null)

                // Recalculate time remaining with new pick_started_at
                if (data.pick_started_at) {
                    const pickStartedAt = new Date(data.pick_started_at).getTime()
                    const endTime = pickStartedAt + ((league?.pick_time_limit || 60) * 1000)
                    const clientNow = Date.now()
                    const remaining = Math.max(0, Math.floor((endTime - clientNow) / 1000))
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

    // Client-side countdown - starts once on mount, pauses when draft is paused
    useEffect(() => {
        if (isPaused) {
            // Don't count down when paused
            return
        }

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev === null || prev <= 0) {
                    return prev
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [isPaused])

    const handleDraftPlayer = (player: Player) => {
        if (!isMyTurn || !league || isPaused) return
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

    const handlePause = () => {
        if (!league) return
        setIsPausing(true)

        router.post(`/fantasy/leagues/${league.id}/draft/pause`, {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsPausing(false)
        })
    }

    const handleResume = () => {
        if (!league) return
        setIsResuming(true)

        router.post(`/fantasy/leagues/${league.id}/draft/resume`, {}, {
            preserveScroll: true,
            onFinish: () => setIsResuming(false)
        })
    }

    const handleLoadMore = () => {
        if (playersPagination && playersPagination.current_page < playersPagination.last_page) {
            fetchPlayers(playersPagination.current_page + 1, searchQuery, positionFilter)
        }
    }

    const positions = ['Guard', 'Forward', 'Center']
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
                                        {isPaused && (
                                            <Badge variant="secondary" className="ml-2 bg-yellow-500 text-white">
                                                ⏸️ PAUSED
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        Round {currentRound} of {totalRounds} • Pick #{currentPick}
                                        {isPaused && pausedBy && (
                                            <span className="ml-2 text-yellow-600">
                                                • Paused by {pausedBy.name}
                                            </span>
                                        )}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2 flex-wrap items-start">
                                    <Badge variant={isConnected ? "default" : "destructive"}>
                                        {isConnected ? '🟢 Live' : '🔴 Connecting...'}
                                    </Badge>
                                    {notificationPermission === 'granted' && (
                                        <Badge variant="outline">🔔 Notifications On</Badge>
                                    )}
                                    {notificationPermission === 'denied' && (
                                        <Badge variant="destructive">🔕 Notifications Blocked</Badge>
                                    )}
                                    {canPauseResume && league?.draft_status === 'in_progress' && (
                                        <div className="flex gap-1">
                                            {!isPaused ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={handlePause}
                                                    disabled={isPausing}
                                                >
                                                    <Pause className="h-4 w-4 mr-1" />
                                                    {isPausing ? 'Pausing...' : 'Pause Draft'}
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={handleResume}
                                                    disabled={isResuming}
                                                >
                                                    <Play className="h-4 w-4 mr-1" />
                                                    {isResuming ? 'Resuming...' : 'Resume Draft'}
                                                </Button>
                                            )}
                                            <Link href={`/fantasy/leagues/${league?.id}/draft/history`}>
                                                <Button size="sm" variant="ghost">
                                                    <History className="h-4 w-4 mr-1" />
                                                    History
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
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

                    {/* Draft Board - Responsive */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Draft Board</CardTitle>
                            <CardDescription>All picks in order</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Desktop: Horizontal scroll */}
                            <div className="hidden md:flex gap-3 overflow-x-auto pb-2">
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

                            {/* Mobile: Vertical list showing recent picks */}
                            <div className="md:hidden space-y-2 max-h-96 overflow-y-auto">
                                {(draftPicks || []).slice().reverse().slice(0, 10).map((pick) => (
                                    <div key={pick.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                        {pick.player.photo_url ? (
                                            <img
                                                src={pick.player.photo_url}
                                                alt={pick.player.name}
                                                className="w-12 h-12 rounded-full object-cover object-top"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                                <User className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">#{pick.pick_number}</Badge>
                                                <span className="font-medium text-sm truncate">{pick.player.name}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">{pick.team.team_name}</div>
                                        </div>
                                        <Badge variant="secondary" className="text-xs">{pick.player.position}</Badge>
                                    </div>
                                ))}
                                {(draftPicks || []).length === 0 && (
                                    <p className="text-sm text-muted-foreground py-8 text-center">No picks yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Available Players */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Available Players</CardTitle>
                            <CardDescription>
                                {isMyTurn && !isPaused ? 'Select a player to draft' : isPaused ? 'Draft is paused' : 'Waiting for your turn...'}
                                {availablePlayersCount !== undefined && (
                                    <span className="ml-2">• {availablePlayersCount} available</span>
                                )}
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
                                {isLoadingPlayers && availablePlayers.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        <span className="ml-2 text-muted-foreground">Loading players...</span>
                                    </div>
                                ) : (
                                    <>
                                        {availablePlayers.map((player) => (
                                            <div
                                                key={player.id}
                                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                {player.photo_url ? (
                                                    <img
                                                        src={player.photo_url}
                                                        alt={player.name}
                                                        className="w-12 h-12 rounded-full object-cover object-top"
                                                        loading="lazy"
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
                                                    disabled={!isMyTurn || isPaused || draftingPlayerId !== null}
                                                >
                                                    {draftingPlayerId === player.id ? 'Drafting...' : 'Draft'}
                                                </Button>
                                            </div>
                                        ))}

                                        {/* Load More Button */}
                                        {playersPagination && playersPagination.current_page < playersPagination.last_page && (
                                            <div className="flex justify-center py-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={handleLoadMore}
                                                    disabled={isLoadingPlayers}
                                                >
                                                    {isLoadingPlayers ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Loading...
                                                        </>
                                                    ) : (
                                                        `Load More (${playersPagination.total - availablePlayers.length} remaining)`
                                                    )}
                                                </Button>
                                            </div>
                                        )}

                                        {availablePlayers.length === 0 && !isLoadingPlayers && (
                                            <p className="text-sm text-muted-foreground py-8 text-center">
                                                No players found matching your search
                                            </p>
                                        )}
                                    </>
                                )}
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
