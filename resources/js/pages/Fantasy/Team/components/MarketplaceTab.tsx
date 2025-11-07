import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PlayerStatsModal from '@/components/PlayerStatsModal';
import { FlashMessages } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { DollarSign, Loader2, Search, ShoppingCart, Users, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface User {
    id: number;
    name: string;
}

interface Team {
    id: number;
    name: string;
    logo_url: string | null;
}

interface Player {
    id: number;
    name: string;
    position: string;
    jersey_number: number | null;
    price: number;
    photo_url: string | null;
    country: string | null;
    is_active: boolean;
    team: Team;
}

interface FantasyTeam {
    id: number;
    team_name: string;
    budget_spent: number;
    budget_remaining: number;
    total_points: number;
    user: User;
}

interface FantasyLeague {
    id: number;
    name: string;
    mode: 'budget' | 'draft';
    budget: number;
    team_size: number;
}

interface PaginatedPlayers {
    data: Player[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    league: FantasyLeague;
    userTeam: FantasyTeam;
    players: PaginatedPlayers;
    myPlayers: Player[];
    filters: {
        position?: string;
        team_id?: number;
        search?: string;
        sort?: string;
        direction?: string;
    };
    isRoundLocked: boolean;
    currentActiveRound: number | null;
}

export default function MarketplaceTab({
    league,
    userTeam,
    players,
    myPlayers,
    filters,
    isRoundLocked,
    currentActiveRound
}: Props) {
    const [search, setSearch] = useState(String(filters?.search || ''));
    const [position, setPosition] = useState(filters?.position ? String(filters.position) : 'all');
    const [sortBy, setSortBy] = useState(String(filters?.sort || 'price'));
    const [buyingPlayerId, setBuyingPlayerId] = useState<number | null>(null);
    const [sellingPlayerId, setSellingPlayerId] = useState<number | null>(null);
    const [confirmSellDialogOpen, setConfirmSellDialogOpen] = useState(false);
    const [playerToSell, setPlayerToSell] = useState<Player | null>(null);

    // Player stats modal state
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [selectedPlayerStats, setSelectedPlayerStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const { props } = usePage();
    const flash = (props.flash || {}) as FlashMessages;

    // Function to fetch and show player stats
    const showPlayerStats = async (playerId: number) => {
        setLoadingStats(true);
        setStatsModalOpen(true);
        try {
            const response = await axios.get(`/api/players/${playerId}/stats`);
            setSelectedPlayerStats(response.data);
        } catch (error) {
            console.error('Failed to load player stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    // Automatically scroll to top when errors appear
    useEffect(() => {
        if (flash.error) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [flash]);

    const updateFilters = (newFilters: any) => {
        router.get(
            `/fantasy/leagues/${league.id}/team`,
            {
                ...filters,
                ...newFilters,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSearch = () => {
        updateFilters({ search, page: 1 });
    };

    const handlePositionChange = (value: string) => {
        setPosition(value);
        updateFilters({ position: value === 'all' ? null : value, page: 1 });
    };

    const handleSortChange = (value: string) => {
        setSortBy(value);
        updateFilters({ sort: value, page: 1 });
    };

    const buyPlayer = (playerId: number) => {
        setBuyingPlayerId(playerId);
        router.post(
            `/fantasy/leagues/${league.id}/players/${playerId}/buy`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setBuyingPlayerId(null),
            },
        );
    };

    const handleSellClick = (player: Player) => {
        setPlayerToSell(player);
        setConfirmSellDialogOpen(true);
    };

    const confirmSell = () => {
        if (!playerToSell) return;
        setSellingPlayerId(playerToSell.id);
        setConfirmSellDialogOpen(false);
        router.delete(`/fantasy/leagues/${league.id}/players/${playerToSell.id}/sell`, {
            preserveScroll: true,
            onFinish: () => {
                setSellingPlayerId(null);
                setPlayerToSell(null);
            },
        });
    };

    const isOwned = (playerId: number) => {
        return myPlayers?.some((p) => p.id === playerId) || false;
    };

    const canAfford = (price: number) => {
        return userTeam?.budget_remaining ? Number(userTeam.budget_remaining) >= price : false;
    };

    const isTeamFull = () => {
        return league?.team_size ? (myPlayers?.length || 0) >= league.team_size : false;
    };

    return (
        <>
            {/* Round Locked Alert */}
            {isRoundLocked && currentActiveRound && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Round {currentActiveRound} in Progress!</strong> All player transactions are locked until the round finishes.
                    </AlertDescription>
                </Alert>
            )}

            {/* My Team Section */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>
                        My Players ({myPlayers?.length || 0}/{league.team_size})
                    </CardTitle>
                    <CardDescription>
                        {league.mode === 'budget' && <>Budget: ${(Number(userTeam.budget_remaining) / 1000000).toFixed(1)}M remaining</>}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {myPlayers && myPlayers.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {myPlayers.map((player) => (
                                <Card key={player.id} className="border-primary">
                                    <CardContent className="pt-6">
                                        <div className="mb-4 flex items-start gap-3">
                                            {player.photo_url ? (
                                                <img
                                                    src={player.photo_url}
                                                    alt={player.name}
                                                    className="h-12 w-12 rounded-full object-cover object-top"
                                                />
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-bold">
                                                    {player.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4
                                                    className="font-medium hover:text-primary cursor-pointer transition-colors"
                                                    onClick={() => showPlayerStats(player.id)}
                                                >
                                                    {player.name}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">{player.team.name}</p>
                                                <div className="mt-1 flex gap-2">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {player.position}
                                                    </Badge>
                                                    {player.jersey_number && (
                                                        <Badge variant="outline" className="text-xs">
                                                            #{player.jersey_number}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Value:</span>
                                                <span className="ml-1 font-bold">${(player.price / 1000000).toFixed(1)}M</span>
                                            </div>
                                            {league.mode === 'budget' && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleSellClick(player)}
                                                    disabled={sellingPlayerId === player.id || isRoundLocked}
                                                >
                                                    {sellingPlayerId === player.id ? (
                                                        <>
                                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                            Selling...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DollarSign className="mr-1 h-3 w-3" />
                                                            Sell
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            <Users className="mx-auto mb-3 h-12 w-12 opacity-50" />
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
                    <div className="flex flex-col gap-4">
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
                            <Button onClick={handleSearch} className="whitespace-nowrap">
                                Search
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Select value={position} onValueChange={handlePositionChange}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="All Positions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Positions</SelectItem>
                                    <SelectItem value="Guard">Guards</SelectItem>
                                    <SelectItem value="Forward">Forwards</SelectItem>
                                    <SelectItem value="Center">Centers</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sortBy} onValueChange={handleSortChange}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="price">Price</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="position">Position</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Players Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {players.data?.map((player) => {
                    const owned = isOwned(player.id);
                    const affordable = canAfford(player.price);
                    const teamFull = isTeamFull();

                    return (
                        <Card key={player.id} className={owned ? 'border-primary' : ''}>
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    {player.photo_url ? (
                                        <img
                                            src={player.photo_url}
                                            alt={player.name}
                                            className="h-16 w-16 rounded-full object-cover object-top"
                                        />
                                    ) : (
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-bold">
                                            {player.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <CardTitle
                                            className="text-lg hover:text-primary cursor-pointer transition-colors"
                                            onClick={() => showPlayerStats(player.id)}
                                        >
                                            {player.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {player.team.name}
                                            {player.jersey_number && ` #${player.jersey_number}`}
                                        </CardDescription>
                                        <div className="mt-2 flex gap-2">
                                            <Badge variant="secondary">{player.position}</Badge>
                                            {owned && <Badge variant="default">Owned</Badge>}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Price</div>
                                        <div className="text-2xl font-bold">${(player.price / 1000000).toFixed(1)}M</div>
                                    </div>
                                    {player.country && <div className="text-sm text-muted-foreground">{player.country}</div>}
                                </div>

                                {league.mode === 'budget' && (
                                    <>
                                        {owned ? (
                                            <Button
                                                variant="destructive"
                                                className="w-full"
                                                onClick={() => handleSellClick(player)}
                                                disabled={sellingPlayerId === player.id || isRoundLocked}
                                            >
                                                {sellingPlayerId === player.id ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Selling...
                                                    </>
                                                ) : (
                                                    <>
                                                        <DollarSign className="mr-2 h-4 w-4" />
                                                        Sell Player
                                                    </>
                                                )}
                                            </Button>
                                        ) : (
                                            <Button
                                                className="w-full"
                                                onClick={() => buyPlayer(player.id)}
                                                disabled={!affordable || teamFull || buyingPlayerId === player.id || isRoundLocked}
                                            >
                                                {buyingPlayerId === player.id ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Buying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                                        {teamFull ? 'Team Full' : !affordable ? 'Cannot Afford' : 'Buy Player'}
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </>
                                )}
                                {league.mode === 'draft' && (
                                    <div className="py-2 text-center text-sm text-muted-foreground">
                                        Players can only be acquired through the draft
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Pagination */}
            <Pagination pagination={players} onPageChange={(page) => updateFilters({ page })} />

            {/* Sell Confirmation Dialog */}
            <Dialog open={confirmSellDialogOpen} onOpenChange={setConfirmSellDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Sell Player</DialogTitle>
                        <DialogDescription>Are you sure you want to sell this player? You will receive the current market value.</DialogDescription>
                    </DialogHeader>
                    {playerToSell && (
                        <div className="py-4">
                            <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                                {playerToSell.photo_url ? (
                                    <img
                                        src={playerToSell.photo_url}
                                        alt={playerToSell.name}
                                        className="h-16 w-16 rounded-full object-cover object-top"
                                    />
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background text-2xl font-bold">
                                        {playerToSell.name.charAt(0)}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="text-lg font-bold">{playerToSell.name}</div>
                                    <div className="text-sm text-muted-foreground">{playerToSell.team.name}</div>
                                    <div className="mt-1 flex gap-2">
                                        <Badge variant="secondary" className="text-xs">
                                            {playerToSell.position}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-muted-foreground">Sell for</div>
                                    <div className="text-2xl font-bold text-green-600">${(playerToSell.price / 1000000).toFixed(1)}M</div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setConfirmSellDialogOpen(false);
                                setPlayerToSell(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmSell}>
                            Confirm Sell
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Player Stats Modal */}
            <PlayerStatsModal
                player={selectedPlayerStats}
                open={statsModalOpen}
                onOpenChange={(open) => {
                    setStatsModalOpen(open);
                    if (!open) {
                        setSelectedPlayerStats(null);
                    }
                }}
            />
        </>
    );
}
