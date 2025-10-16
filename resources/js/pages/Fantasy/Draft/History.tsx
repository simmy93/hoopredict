import { Head, Link } from '@inertiajs/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, User, Trophy, Pause, Play, CheckCircle } from 'lucide-react'
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
}

interface FantasyTeam {
    id: number
    name: string
    user: User | null
}

interface DraftAction {
    id: number
    action_type: string
    action_at: string
    user: User | null
    team: FantasyTeam | null
    player: Player | null
    pick_number: number | null
    round_number: number | null
    details: any
}

interface Championship {
    id: number
    name: string
    season: string
}

interface FantasyLeague {
    id: number
    name: string
    owner: User
    championship: Championship
}

interface Props {
    league: FantasyLeague
    userTeam: FantasyTeam
    draftActions: DraftAction[]
}

export default function History({ league, userTeam, draftActions }: Props) {
    const getActionIcon = (actionType: string) => {
        switch (actionType) {
            case 'start':
                return <Trophy className="h-4 w-4" />
            case 'pick':
                return <User className="h-4 w-4" />
            case 'auto_pick':
                return <Clock className="h-4 w-4" />
            case 'pause':
                return <Pause className="h-4 w-4" />
            case 'resume':
                return <Play className="h-4 w-4" />
            case 'complete':
                return <CheckCircle className="h-4 w-4" />
            default:
                return <Clock className="h-4 w-4" />
        }
    }

    const getActionBadgeVariant = (actionType: string) => {
        switch (actionType) {
            case 'start':
            case 'complete':
                return 'default'
            case 'pick':
                return 'secondary'
            case 'auto_pick':
                return 'outline'
            case 'pause':
                return 'destructive'
            case 'resume':
                return 'default'
            default:
                return 'outline'
        }
    }

    const formatActionDescription = (action: DraftAction) => {
        switch (action.action_type) {
            case 'start':
                return `${action.user?.name || 'Someone'} started the draft`
            case 'pick':
                return (
                    <>
                        <span className="font-semibold">{action.team?.user?.name || 'Someone'}</span>
                        {' '}drafted{' '}
                        <span className="font-semibold">{action.player?.name}</span>
                        {' '}({action.player?.position})
                        {action.pick_number && action.round_number && (
                            <span className="text-muted-foreground ml-2">
                                • Round {action.round_number}, Pick #{action.pick_number}
                            </span>
                        )}
                    </>
                )
            case 'auto_pick':
                return (
                    <>
                        <span className="font-semibold">{action.player?.name}</span>
                        {' '}was auto-picked for{' '}
                        <span className="font-semibold">{action.team?.user?.name || 'Someone'}</span>
                        {action.pick_number && action.round_number && (
                            <span className="text-muted-foreground ml-2">
                                • Round {action.round_number}, Pick #{action.pick_number}
                            </span>
                        )}
                    </>
                )
            case 'pause':
                return (
                    <>
                        <span className="font-semibold">{action.user?.name || 'Someone'}</span>
                        {' '}paused the draft
                        {action.details?.time_remaining && (
                            <span className="text-muted-foreground ml-2">
                                • {action.details.time_remaining}s remaining on clock
                            </span>
                        )}
                    </>
                )
            case 'resume':
                return `${action.user?.name || 'Someone'} resumed the draft`
            case 'complete':
                return 'Draft completed'
            default:
                return `Unknown action: ${action.action_type}`
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Draft History - ${league.name}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between">
                        <Link href={`/fantasy/leagues/${league.id}/draft`}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Draft
                            </Button>
                        </Link>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Clock className="h-6 w-6" />
                                Draft History
                            </CardTitle>
                            <CardDescription>
                                Complete audit log of all draft actions for {league.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {draftActions.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No draft actions recorded yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {draftActions.map((action) => (
                                        <div
                                            key={action.id}
                                            className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex-shrink-0 mt-1">
                                                {getActionIcon(action.action_type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-2 mb-1">
                                                    <Badge variant={getActionBadgeVariant(action.action_type)}>
                                                        {action.action_type.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm">
                                                    {formatActionDescription(action)}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatTime(action.action_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
