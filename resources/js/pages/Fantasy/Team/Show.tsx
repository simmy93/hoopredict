import React, { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Search, ArrowLeft, DollarSign, Users } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

interface User {
    id: number
    name: string
}

interface Team {
    id: number
    name: string
    logo_url: string | null
}

interface Player {
    id: number
    name: string
    position: string
    jersey_number: number | null
    price: number
    photo_url: string | null
    country: string | null
    is_active: boolean
    team: Team
}

interface FantasyTeam {
    id: number
    team_name: string
    budget_spent: number
    budget_remaining: number
    total_points: number
    user: User
}

interface FantasyLeague {
    id: number
    name: string
    mode: 'budget' | 'draft'
    budget: number
    team_size: number
}

interface PaginatedPlayers {
    data: Player[]
    current_page: number
    last_page: number
    per_page: number
    total: number
}

interface Props {
    league?: FantasyLeague
    userTeam?: FantasyTeam
    players?: PaginatedPlayers
    myPlayers?: Player[]
    filters?: {
        position?: string
        team_id?: number
        search?: string
        sort?: string
        direction?: string
    }
}

export default function Index({ league, userTeam, players, myPlayers = [], filters = {} }: Props) {
    const [search, setSearch] = useState(String(filters?.search || ''))
    const [position, setPosition] = useState(String(filters?.position || 'all'))
    const [sortBy, setSortBy] = useState(String(filters?.sort || 'price'))
    const [direction, setDirection] = useState(String(filters?.direction || 'desc'))

    const updateFilters = (newFilters: any) => {
        if (!league?.id) return
        router.get(`/fantasy/leagues/${league.id}/team`, {
            ...filters,
            ...newFilters,
        }, {
            preserveState: true,
            preserveScroll: true,
        })
    }

    const handleSearch = () => {
        updateFilters({ search, page: 1 })
    }

    const handlePositionChange = (value: string) => {
        setPosition(value)
        updateFilters({ position: value === 'all' ? null : value, page: 1 })
    }

    const handleSortChange = (value: string) => {
        setSortBy(value)
        updateFilters({ sort: value, page: 1 })
    }

    const buyPlayer = (playerId: number) => {
        if (!league?.id) return
        router.post(`/fantasy/leagues/${league.id}/players/${playerId}/buy`, {}, {
            preserveScroll: true,
        })
    }

    const sellPlayer = (playerId: number) => {
        if (!league?.id) return
        router.delete(`/fantasy/leagues/${league.id}/players/${playerId}/sell`, {
            preserveScroll: true,
        })
    }

    const isOwned = (playerId: number) => {
        return myPlayers?.some(p => p.id === playerId) || false
    }

    const canAfford = (price: number) => {
        return userTeam?.budget_remaining ? Number(userTeam.budget_remaining) >= price : false
    }

    const isTeamFull = () => {
        return league?.team_size ? (myPlayers?.length || 0) >= league.team_size : false
    }

    if (!league || !userTeam || !players) {
        return <div>Loading...</div>
    }

    return (
        <AuthenticatedLayout>
            <Head title={`My Team - ${league.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link
                            href={`/fantasy/leagues/${league.id}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to League
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Users className="h-8 w-8" />
                            {userTeam.team_name}
                        </h1>
                        <p className="text-muted-foreground mt-1">{league.name}</p>
                    </div>

                    {/* My Team Section */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>My Players ({myPlayers?.length || 0}/{league.team_size})</CardTitle>
                            <CardDescription>
                                {league.mode === 'budget' && (
                                    <>Budget: ${(Number(userTeam.budget_remaining) / 1000000).toFixed(1)}M remaining</>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {myPlayers && myPlayers.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {myPlayers.map((player) => (
                                        <Card key={player.id} className="border-primary">
                                            <CardContent className="pt-6">
                                                <div className="flex items-start gap-3 mb-4">
                                                    {player.photo_url ? (
                                                        <img
                                                            src={player.photo_url}
                                                            alt={player.name}
                                                            className="w-12 h-12 rounded-full object-cover object-top"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                                                            {player.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <h4 className="font-medium">{player.name}</h4>
                                                        <p className="text-sm text-muted-foreground">{player.team.name}</p>
                                                        <div className="flex gap-2 mt-1">
                                                            <Badge variant="secondary" className="text-xs">{player.position}</Badge>
                                                            {player.jersey_number && (
                                                                <Badge variant="outline" className="text-xs">#{player.jersey_number}</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm">
                                                        <span className="text-muted-foreground">Value:</span>
                                                        <span className="font-bold ml-1">${(player.price / 1000000).toFixed(1)}M</span>
                                                    </div>
                                                    {league.mode === 'budget' && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => sellPlayer(player.id)}
                                                        >
                                                            <DollarSign className="h-3 w-3 mr-1" />
                                                            Sell
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No players yet. Start building your team below!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Available Players Title */}
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold">Available Players</h2>
                        <p className="text-muted-foreground">Browse and buy players for your team</p>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[300px]">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search players..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                className="pl-10"
                                            />
                                        </div>
                                        <Button onClick={handleSearch}>Search</Button>
                                    </div>
                                </div>

                                <Select value={position} onValueChange={handlePositionChange}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Positions</SelectItem>
                                        <SelectItem value="Guard">Guards</SelectItem>
                                        <SelectItem value="Forward">Forwards</SelectItem>
                                        <SelectItem value="Center">Centers</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={sortBy} onValueChange={handleSortChange}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="price">Price</SelectItem>
                                        <SelectItem value="name">Name</SelectItem>
                                        <SelectItem value="position">Position</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Players Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {players.data?.map((player) => {
                            const owned = isOwned(player.id)
                            const affordable = canAfford(player.price)
                            const teamFull = isTeamFull()

                            return (
                                <Card key={player.id} className={owned ? 'border-primary' : ''}>
                                    <CardHeader>
                                        <div className="flex items-start gap-4">
                                            {player.photo_url ? (
                                                <img
                                                    src={player.photo_url}
                                                    alt={player.name}
                                                    className="w-16 h-16 rounded-full object-cover object-top"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                                                    {player.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{player.name}</CardTitle>
                                                <CardDescription>
                                                    {player.team.name}
                                                    {player.jersey_number && ` #${player.jersey_number}`}
                                                </CardDescription>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge variant="secondary">{player.position}</Badge>
                                                    {owned && <Badge variant="default">Owned</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <div className="text-sm text-muted-foreground">Price</div>
                                                <div className="text-2xl font-bold">
                                                    ${(player.price / 1000000).toFixed(1)}M
                                                </div>
                                            </div>
                                            {player.country && (
                                                <div className="text-sm text-muted-foreground">
                                                    {player.country}
                                                </div>
                                            )}
                                        </div>

                                        {league.mode === 'budget' && (
                                            <>
                                                {owned ? (
                                                    <Button
                                                        variant="destructive"
                                                        className="w-full"
                                                        onClick={() => sellPlayer(player.id)}
                                                    >
                                                        <DollarSign className="h-4 w-4 mr-2" />
                                                        Sell Player
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        className="w-full"
                                                        onClick={() => buyPlayer(player.id)}
                                                        disabled={!affordable || teamFull}
                                                    >
                                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                                        {teamFull
                                                            ? 'Team Full'
                                                            : !affordable
                                                            ? 'Cannot Afford'
                                                            : 'Buy Player'}
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                        {league.mode === 'draft' && (
                                            <div className="text-center text-sm text-muted-foreground py-2">
                                                Players can only be acquired through the draft
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Pagination */}
                    {players.last_page > 1 && (
                        <div className="mt-6 flex justify-center gap-2">
                            {Array.from({ length: players.last_page }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === players.current_page ? 'default' : 'outline'}
                                    onClick={() => updateFilters({ page })}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
