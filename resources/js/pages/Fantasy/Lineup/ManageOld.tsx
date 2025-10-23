import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trophy, User, GripVertical, Sparkles, AlertCircle, CheckCircle2, Info } from 'lucide-react'
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
    position: 'Guard' | 'Forward' | 'Center'
    price: number
    photo_url: string | null
    team: Team
}

interface FantasyTeamPlayer {
    id: number
    fantasy_team_id: number
    player_id: number
    lineup_position: number | null
    purchase_price: number
    points_earned: number
    player: Player
}

interface Championship {
    id: number
    name: string
    season: string
}

interface FantasyLeague {
    id: number
    name: string
    mode: 'budget' | 'draft'
    team_size: number
    championship: Championship
}

interface FantasyTeam {
    id: number
    team_name: string
    budget_spent: number
    budget_remaining: number
    total_points: number
    user: User
}

interface PositionCounts {
    Guard: number
    Forward: number
    Center: number
}

interface Props {
    league: FantasyLeague
    userTeam: FantasyTeam
    teamPlayers: FantasyTeamPlayer[]
    positionCounts: PositionCounts
    startingLineupCounts: PositionCounts
    hasValidTeamComposition: boolean
    hasValidStartingLineup: boolean
}

export default function Manage({
    league,
    userTeam,
    teamPlayers: initialTeamPlayers,
    positionCounts,
    startingLineupCounts,
    hasValidTeamComposition,
    hasValidStartingLineup: initialHasValidStartingLineup
}: Props) {
    const [teamPlayers, setTeamPlayers] = useState(initialTeamPlayers)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [isValidLineup, setIsValidLineup] = useState(initialHasValidStartingLineup)
    const [isSaving, setIsSaving] = useState(false)
    const [isAutoGenerating, setIsAutoGenerating] = useState(false)

    // Sort players by lineup position
    const sortedPlayers = [...teamPlayers].sort((a, b) => {
        const posA = a.lineup_position ?? 999
        const posB = b.lineup_position ?? 999
        return posA - posB
    })

    // Get multiplier text and color
    const getMultiplierInfo = (position: number | null) => {
        if (!position) return { text: 'Not in lineup', color: 'text-gray-400', multiplier: 0 }
        if (position <= 5) return { text: '100%', color: 'text-green-600', multiplier: 1.0 }
        if (position === 6) return { text: '75%', color: 'text-yellow-600', multiplier: 0.75 }
        return { text: '50%', color: 'text-orange-600', multiplier: 0.5 }
    }

    // Get position badge color
    const getPositionColor = (position: string) => {
        switch (position) {
            case 'Guard': return 'bg-blue-500'
            case 'Forward': return 'bg-amber-500'
            case 'Center': return 'bg-red-500'
            default: return 'bg-gray-500'
        }
    }

    // Get role label
    const getRoleLabel = (position: number | null) => {
        if (!position) return null
        if (position <= 5) return 'STARTER'
        if (position === 6) return 'SIXTH MAN'
        return 'BENCH'
    }

    // Validate starting lineup composition
    const validateStartingLineup = (players: FantasyTeamPlayer[]) => {
        const starters = players.filter(p => p.lineup_position && p.lineup_position <= 5)

        if (starters.length !== 5) {
            setValidationErrors(['Must have exactly 5 starters'])
            setIsValidLineup(false)
            return false
        }

        const counts = {
            Guard: starters.filter(p => p.player.position === 'Guard').length,
            Forward: starters.filter(p => p.player.position === 'Forward').length,
            Center: starters.filter(p => p.player.position === 'Center').length,
        }

        const errors = []

        if (counts.Guard < 1) errors.push('Need at least 1 Guard in starting 5')
        if (counts.Forward < 1) errors.push('Need at least 1 Forward in starting 5')
        if (counts.Center < 1) errors.push('Need at least 1 Center in starting 5')
        if (counts.Guard > 3) errors.push('Maximum 3 Guards in starting 5')
        if (counts.Forward > 3) errors.push('Maximum 3 Forwards in starting 5')
        if (counts.Center > 2) errors.push('Maximum 2 Centers in starting 5')

        setValidationErrors(errors)
        setIsValidLineup(errors.length === 0)
        return errors.length === 0
    }

    // Handle drag start
    const handleDragStart = (index: number) => {
        setDraggedIndex(index)
    }

    // Handle drag over
    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()

        if (draggedIndex === null || draggedIndex === index) return

        const newPlayers = [...sortedPlayers]
        const draggedItem = newPlayers[draggedIndex]

        // Remove from old position
        newPlayers.splice(draggedIndex, 1)

        // Insert at new position
        newPlayers.splice(index, 0, draggedItem)

        // Update lineup positions
        const updatedPlayers = newPlayers.map((player, idx) => ({
            ...player,
            lineup_position: idx + 1
        }))

        setTeamPlayers(updatedPlayers)
        setDraggedIndex(index)
        validateStartingLineup(updatedPlayers)
    }

    // Handle drag end
    const handleDragEnd = () => {
        setDraggedIndex(null)
    }

    // Save lineup
    const handleSave = () => {
        if (!isValidLineup) {
            return
        }

        setIsSaving(true)

        const lineup = sortedPlayers.map(p => p.player.id)

        router.post(`/fantasy/leagues/${league.id}/lineup`, {
            lineup
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSaving(false)
            },
            onError: () => {
                setIsSaving(false)
            }
        })
    }

    // Auto-generate lineup
    const handleAutoGenerate = () => {
        setIsAutoGenerating(true)

        router.post(`/fantasy/leagues/${league.id}/lineup/auto-generate`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsAutoGenerating(false)
            },
            onError: () => {
                setIsAutoGenerating(false)
            }
        })
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Manage Lineup - ${league.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={`/fantasy/leagues/${league.id}`} className="text-muted-foreground hover:text-foreground">
                            ← Back to League
                        </Link>
                    </div>

                    {/* Header */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl flex items-center gap-3">
                                        <Trophy className="h-6 w-6" />
                                        Manage Lineup
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        {userTeam.team_name} - {league.name}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleAutoGenerate}
                                        disabled={isAutoGenerating || !hasValidTeamComposition}
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        {isAutoGenerating ? 'Generating...' : 'Auto-Generate'}
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={!isValidLineup || isSaving}
                                    >
                                        {isSaving ? 'Saving...' : 'Save Lineup'}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Validation Status */}
                            {!hasValidTeamComposition && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Invalid team composition. Need minimum: 3 Guards, 3 Forwards, 2 Centers
                                    </AlertDescription>
                                </Alert>
                            )}

                            {hasValidTeamComposition && validationErrors.length > 0 && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <div className="font-medium">Starting lineup errors:</div>
                                        <ul className="list-disc list-inside mt-1">
                                            {validationErrors.map((error, idx) => (
                                                <li key={idx}>{error}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {isValidLineup && (
                                <Alert className="mb-4 border-green-500 text-green-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertDescription>
                                        Valid lineup! Ready to save.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Team Composition Summary */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Guards</div>
                                    <div className="text-2xl font-bold">
                                        {positionCounts.Guard}
                                        <span className="text-sm text-muted-foreground ml-1">/ min 3</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Starters: {startingLineupCounts.Guard} (max 3)
                                    </div>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Forwards</div>
                                    <div className="text-2xl font-bold">
                                        {positionCounts.Forward}
                                        <span className="text-sm text-muted-foreground ml-1">/ min 3</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Starters: {startingLineupCounts.Forward} (max 3)
                                    </div>
                                </div>
                                <div className="p-3 bg-red-50 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Centers</div>
                                    <div className="text-2xl font-bold">
                                        {positionCounts.Center}
                                        <span className="text-sm text-muted-foreground ml-1">/ min 2</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Starters: {startingLineupCounts.Center} (max 2)
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Scoring:</strong> Starters (1-5) = 100%, Sixth Man (6) = 75%, Bench (7-10) = 50%
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>

                    {/* Lineup */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Lineup</CardTitle>
                            <CardDescription>Drag to reorder players. Top 5 are starters.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {sortedPlayers.map((teamPlayer, index) => {
                                    const multiplierInfo = getMultiplierInfo(teamPlayer.lineup_position)
                                    const roleLabel = getRoleLabel(teamPlayer.lineup_position)

                                    return (
                                        <div
                                            key={teamPlayer.id}
                                            draggable
                                            onDragStart={() => handleDragStart(index)}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDragEnd={handleDragEnd}
                                            className={`
                                                flex items-center gap-3 p-4 border rounded-lg cursor-move
                                                transition-all hover:bg-muted/50
                                                ${draggedIndex === index ? 'opacity-50' : ''}
                                                ${teamPlayer.lineup_position && teamPlayer.lineup_position <= 5 ? 'bg-green-50 border-green-300' : ''}
                                                ${teamPlayer.lineup_position === 6 ? 'bg-yellow-50 border-yellow-300' : ''}
                                            `}
                                        >
                                            <GripVertical className="h-5 w-5 text-muted-foreground" />

                                            <div className="w-8 text-center font-bold text-lg">
                                                {index + 1}
                                            </div>

                                            {teamPlayer.player.photo_url ? (
                                                <img
                                                    src={teamPlayer.player.photo_url}
                                                    alt={teamPlayer.player.name}
                                                    className="w-12 h-12 rounded-full object-cover object-top"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                                    <User className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                <div className="font-medium">{teamPlayer.player.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {teamPlayer.player.team.name}
                                                </div>
                                            </div>

                                            <Badge className={getPositionColor(teamPlayer.player.position) + ' text-white'}>
                                                {teamPlayer.player.position}
                                            </Badge>

                                            {roleLabel && (
                                                <Badge variant="outline" className="min-w-[100px] justify-center">
                                                    {roleLabel}
                                                </Badge>
                                            )}

                                            <div className="text-right min-w-[60px]">
                                                <div className={`font-bold ${multiplierInfo.color}`}>
                                                    {multiplierInfo.text}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    multiplier
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
