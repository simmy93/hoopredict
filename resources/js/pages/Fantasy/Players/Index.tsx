import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { ShoppingCart, Search, ArrowLeft, DollarSign } from 'lucide-react'
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
        router.get(`/fantasy/leagues/${league.id}/players`, {
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
        router.post(`/fantasy/leagues/${league.id}/players/${playerId}/buy`)
    }

    const sellPlayer = (playerId: number) => {
        if (!league?.id) return
        router.delete(`/fantasy/leagues/${league.id}/players/${playerId}/sell`)
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
            <Head title={`Player Marketplace - ${league.name}`} />

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
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                                <h1 className="text-2xl font-bold">Player Marketplace</h1>
                            </div>
                            <p className="text-muted-foreground mt-1">{league.name}</p>
                        </div>
                        <Card className="w-64">
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Budget Remaining</span>
                                        <span className="text-lg font-bold text-green-600">
                                            ${(Number(userTeam.budget_remaining) / 1000000).toFixed(1)}M
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Players</span>
                                        <span className="font-medium">
                                            {myPlayers?.length || 0}/{league.team_size}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
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
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Pagination */}
                    <Pagination pagination={players} onPageChange={(page) => updateFilters({ page })} />
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
