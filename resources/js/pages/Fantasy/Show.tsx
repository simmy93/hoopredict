import React, { useState, useEffect } from 'react'
import { Head, Link, router, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trophy, Users, ShoppingCart, Share2, Copy, Check, Play, Eye, ListOrdered, Trash, UserMinus } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

declare global {
    interface Window {
        Echo: any;
    }
}

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
    draft_status?: 'pending' | 'in_progress' | 'completed'
}

interface Props {
    league: FantasyLeague
    userTeam: FantasyTeam | null
    leaderboard: FantasyTeam[]
    inviteUrl: string
}

export default function Show({ league: initialLeague, userTeam, leaderboard, inviteUrl }: Props) {
    const [copied, setCopied] = useState(false)
    const [startDraftDialogOpen, setStartDraftDialogOpen] = useState(false)
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean
        title: string
        description: string
        variant?: 'default' | 'destructive'
        onConfirm: () => void
    }>({
        open: false,
        title: '',
        description: '',
        variant: 'default',
        onConfirm: () => {}
    })
    const { post: startDraft, processing: startingDraft } = useForm()
    const { delete: destroy, processing } = useForm()
    const [league, setLeague] = useState(initialLeague)
    const [isConnected, setIsConnected] = useState(false)

    const isOwner = userTeam?.user.id === league.owner_id
    const isMember = !!userTeam

    const copyInviteUrl = () => {
        navigator.clipboard.writeText(inviteUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleStartDraft = () => {
        setStartDraftDialogOpen(true)
    }

    const confirmStartDraft = () => {
        startDraft(`/fantasy/leagues/${league.id}/draft/start`)
        setStartDraftDialogOpen(false)
    }

    const leaveLeague = () => {
        setConfirmDialog({
            open: true,
            title: 'Leave Fantasy League',
            description: `Are you sure you want to leave "${league.name}"? You can rejoin later if the league is still active.`,
            variant: 'destructive',
            onConfirm: () => {
                destroy(`/fantasy/leagues/${league.id}/leave`)
            }
        })
    }

    const deleteLeague = () => {
        setConfirmDialog({
            open: true,
            title: 'Delete Fantasy League',
            description: `Are you sure you want to delete "${league.name}"? This action cannot be undone and will remove all teams and data.`,
            variant: 'destructive',
            onConfirm: () => {
                destroy(`/fantasy/leagues/${league.id}`)
            }
        })
    }

    // Subscribe to draft channel to listen for real-time updates
    useEffect(() => {
        if (!league || league.mode !== 'draft') return

        const checkEcho = setInterval(() => {
            if (window.Echo) {
                clearInterval(checkEcho)
                setupEcho()
            }
        }, 100)

        const setupEcho = () => {
            console.log(`Subscribing to draft.${league.id} private channel for updates...`)
            const channel = window.Echo.private(`draft.${league.id}`)

            channel.subscribed(() => {
                console.log('✅ Subscribed to draft private channel on league page')
                setIsConnected(true)
            })

            // Handle connection errors
            channel.error((error: any) => {
                console.error('❌ Channel connection error:', error)
                setIsConnected(false)
            })

            // Listen for draft started event
            channel.listen('DraftStarted', (data: any) => {
                console.log('🚀 Draft started event received on league page!', data)
                // Update league status to reflect draft has started
                setLeague(prev => ({
                    ...prev,
                    draft_status: 'in_progress'
                }))
            })

            // Listen for draft completed event
            channel.listen('DraftCompleted', (data: any) => {
                console.log('🏁 Draft completed event received on league page!', data)
                // Update league status to reflect draft is complete
                setLeague(prev => ({
                    ...prev,
                    draft_status: 'completed'
                }))
            })
        }

        return () => {
            clearInterval(checkEcho)
            if (window.Echo && league) {
                window.Echo.leave(`draft.${league.id}`)
            }
        }
    }, [league?.id])

    return (
        <AuthenticatedLayout>
            <Head title={league.name} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href="/fantasy/leagues" className="text-muted-foreground hover:text-foreground">
                            ← Back to Fantasy Leagues
                        </Link>
                    </div>

                    {/* League Header */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                                <div>
                                    <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2 sm:gap-3">
                                        <Trophy className="h-6 w-6 sm:h-8 sm:w-8" />
                                        {league.name}
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        {league.championship.name} - {league.championship.season}
                                    </CardDescription>
                                </div>
                                <Badge variant={league.mode === 'budget' ? 'default' : 'secondary'} className="w-fit">
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

                            {/* Draft Controls */}
                            {league.mode === 'draft' && userTeam && (
                                <div className="mt-6">
                                    {league.draft_status === 'pending' && league.owner_id === userTeam.user.id && (
                                        <>
                                            <Button
                                                onClick={handleStartDraft}
                                                disabled={startingDraft || league.teams.length < 2}
                                                className="w-full"
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                {startingDraft ? 'Starting Draft...' : 'Start Draft'}
                                            </Button>
                                            {league.teams.length < 2 && (
                                                <p className="text-sm text-muted-foreground text-center mt-2">
                                                    At least 2 members are required to start the draft
                                                </p>
                                            )}
                                        </>
                                    )}
                                    {league.draft_status === 'pending' && league.owner_id !== userTeam?.user.id && (
                                        <div className="text-center py-4 bg-muted rounded-md">
                                            <p className="text-sm text-muted-foreground">
                                                Waiting for league owner to start the draft...
                                            </p>
                                        </div>
                                    )}
                                    {league.draft_status === 'in_progress' && (
                                        <Link href={`/fantasy/leagues/${league.id}/draft`}>
                                            <Button className="w-full">
                                                <Eye className="h-4 w-4 mr-2" />
                                                Join Draft Room
                                            </Button>
                                        </Link>
                                    )}
                                    {league.draft_status === 'completed' && (
                                        <div className="text-center py-4 bg-green-50 rounded-md">
                                            <p className="text-sm text-green-700 font-medium">
                                                Draft Completed
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Invite URL */}
                            <div className="mt-6 flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-md overflow-hidden">
                                    <Share2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <code className="flex-1 text-xs sm:text-sm truncate">{inviteUrl}</code>
                                </div>
                                <Button variant="outline" onClick={copyInviteUrl} className="w-full sm:w-auto">
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

                            {/* Leave/Delete League */}
                            {isMember && (
                                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                    {!isOwner && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={leaveLeague}
                                            disabled={processing}
                                            className="w-full sm:w-auto"
                                        >
                                            <UserMinus className="h-4 w-4 mr-2" />
                                            Leave League
                                        </Button>
                                    )}
                                    {isOwner && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={deleteLeague}
                                            disabled={processing}
                                            className="w-full sm:w-auto"
                                        >
                                            <Trash className="h-4 w-4 mr-2" />
                                            Delete League
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
                        {/* My Team */}
                        {userTeam && (
                            <Card className="lg:col-span-1 w-full">
                                <CardHeader>
                                    <CardTitle>My Team</CardTitle>
                                    <CardDescription>{userTeam.team_name}</CardDescription>
                                    <div className="flex flex-col gap-2 mt-3 sm:flex-row">
                                        <Link href={`/fantasy/leagues/${league.id}/team`} className="flex-1">
                                            <Button size="sm" variant="outline" className="w-full text-xs sm:text-sm">
                                                <ShoppingCart className="h-4 w-4 mr-1 sm:mr-2" />
                                                View Team
                                            </Button>
                                        </Link>
                                        <Link href={`/fantasy/leagues/${league.id}/lineup`} className="flex-1">
                                            <Button size="sm" className="w-full text-xs sm:text-sm">
                                                <ListOrdered className="h-4 w-4 mr-1 sm:mr-2" />
                                                Manage Lineup
                                            </Button>
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-xs sm:text-sm text-muted-foreground">Total Points</span>
                                            <span className="text-xl sm:text-2xl font-bold text-primary">
                                                {userTeam.total_points.toFixed(1)}
                                            </span>
                                        </div>

                                        {league.mode === 'budget' && (
                                            <>
                                                <div className="flex justify-between items-center gap-2 text-xs sm:text-sm">
                                                    <span className="text-muted-foreground">Budget Spent</span>
                                                    <span className="font-medium whitespace-nowrap">
                                                        ${(userTeam.budget_spent / 1000000).toFixed(1)}M
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center gap-2 text-xs sm:text-sm">
                                                    <span className="text-muted-foreground">Budget Remaining</span>
                                                    <span className="font-medium text-green-600 whitespace-nowrap">
                                                        ${(userTeam.budget_remaining / 1000000).toFixed(1)}M
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        <div className="flex justify-between items-center gap-2 text-xs sm:text-sm">
                                            <span className="text-muted-foreground">Players</span>
                                            <span className="font-medium whitespace-nowrap">
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
                        <Card className={userTeam ? 'lg:col-span-2 w-full' : 'lg:col-span-3 w-full'}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5" />
                                    Leaderboard
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
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
                                                    <TableCell className="font-medium whitespace-nowrap">{team.team_name}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{team.user.name}</TableCell>
                                                    <TableCell className="text-right font-bold whitespace-nowrap">
                                                        {team.total_points.toFixed(1)}
                                                    </TableCell>
                                                    {league.mode === 'budget' && (
                                                        <>
                                                            <TableCell className="text-right whitespace-nowrap">
                                                                ${(team.budget_spent / 1000000).toFixed(1)}M
                                                            </TableCell>
                                                            <TableCell className="text-right text-green-600 whitespace-nowrap">
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

            {/* Start Draft Confirmation Dialog */}
            <Dialog open={startDraftDialogOpen} onOpenChange={setStartDraftDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start Draft</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to start the draft? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            Once the draft starts, all league members will be able to draft players in the assigned order.
                            Each pick will have a time limit, and the draft cannot be paused or restarted.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setStartDraftDialogOpen(false)}
                            disabled={startingDraft}
                        >
                            Cancel
                        </Button>
                        <Button onClick={confirmStartDraft} disabled={startingDraft}>
                            {startingDraft ? 'Starting...' : 'Start Draft'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* General Confirmation Dialog (Leave/Delete) */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{confirmDialog.title}</DialogTitle>
                        <DialogDescription>{confirmDialog.description}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={confirmDialog.variant === 'destructive' ? 'destructive' : 'default'}
                            onClick={() => {
                                confirmDialog.onConfirm()
                                setConfirmDialog({ ...confirmDialog, open: false })
                            }}
                            disabled={processing}
                        >
                            {processing ? 'Processing...' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    )
}
