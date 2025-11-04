import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/ui/pagination';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { DollarSign, Search, TrendingUp, RefreshCw, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';
import { FlashMessages } from '@/types';

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
    team: Team;
    is_active: boolean;
}

interface PaginatedPlayers {
    data: Player[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    players: PaginatedPlayers;
    teams: Team[];
    filters: {
        search?: string;
        team_id?: number;
        position?: string;
        sort?: string;
        direction?: string;
    };
}

export default function Index({ players, teams, filters = {} }: Props) {
    const { props } = usePage();
    const flash = (props.flash || {}) as FlashMessages;

    const [search, setSearch] = useState(filters.search || '');
    const [teamId, setTeamId] = useState(filters.team_id?.toString() || 'all');
    const [position, setPosition] = useState(filters.position || 'all');
    const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [newPrice, setNewPrice] = useState<string>('');
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [resetPrice, setResetPrice] = useState<string>('5000000');

    const updateFilters = (newFilters: any) => {
        router.get(
            '/admin/players',
            {
                ...filters,
                ...newFilters,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleSearch = () => {
        updateFilters({ search, page: 1 });
    };

    const handleSort = (field: string) => {
        const newDirection = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        updateFilters({ sort: field, direction: newDirection });
    };

    const toggleSelectAll = () => {
        if (selectedPlayers.length === players.data.length) {
            setSelectedPlayers([]);
        } else {
            setSelectedPlayers(players.data.map((p) => p.id));
        }
    };

    const togglePlayer = (playerId: number) => {
        if (selectedPlayers.includes(playerId)) {
            setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId));
        } else {
            setSelectedPlayers([...selectedPlayers, playerId]);
        }
    };

    const openEditDialog = (player: Player) => {
        setEditingPlayer(player);
        setNewPrice(player.price ? (player.price / 1000000).toString() : '5.0');
    };

    const updatePrice = () => {
        if (!editingPlayer || !newPrice) return;

        router.patch(
            `/admin/players/${editingPlayer.id}/price`,
            { price: parseFloat(newPrice) * 1000000 },
            {
                onSuccess: () => {
                    setEditingPlayer(null);
                    setNewPrice('');
                },
            }
        );
    };

    const bulkUpdatePrices = () => {
        router.post(
            '/admin/players/bulk-update',
            { player_ids: selectedPlayers },
            {
                onSuccess: () => {
                    setShowBulkDialog(false);
                    setSelectedPlayers([]);
                },
            }
        );
    };

    const resetPrices = () => {
        router.post(
            '/admin/players/reset-prices',
            {
                player_ids: selectedPlayers,
                base_price: parseFloat(resetPrice),
            },
            {
                onSuccess: () => {
                    setShowResetDialog(false);
                    setSelectedPlayers([]);
                },
            }
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Players Management" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold">Players Management</h1>
                        <p className="mt-1 text-muted-foreground">Manage player prices and information</p>
                    </div>

                    {/* Flash Messages */}
                    {flash.success && (
                        <div className="mb-6 rounded-lg bg-green-100 border border-green-200 p-4 text-sm font-medium text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200">
                            {flash.success}
                        </div>
                    )}

                    {flash.error && (
                        <div className="mb-6 rounded-lg bg-red-100 border border-red-200 p-4 text-sm font-medium text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                            {flash.error}
                        </div>
                    )}

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                <div className="min-w-[300px] flex-1">
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

                                <Select value={teamId} onValueChange={(value) => {
                                    setTeamId(value);
                                    updateFilters({ team_id: value === 'all' ? null : value, page: 1 });
                                }}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Teams</SelectItem>
                                        {teams.map((team) => (
                                            <SelectItem key={team.id} value={team.id.toString()}>
                                                {team.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={position} onValueChange={(value) => {
                                    setPosition(value);
                                    updateFilters({ position: value === 'all' ? null : value, page: 1 });
                                }}>
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
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bulk Actions */}
                    {selectedPlayers.length > 0 && (
                        <Card className="mb-6">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">
                                        {selectedPlayers.length} player{selectedPlayers.length > 1 ? 's' : ''} selected
                                    </p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setShowBulkDialog(true)}>
                                            <TrendingUp className="mr-2 h-4 w-4" />
                                            Update by Performance
                                        </Button>
                                        <Button variant="outline" onClick={() => setShowResetDialog(true)}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Reset Prices
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Players Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Players ({players.total})</CardTitle>
                                    <CardDescription>Click on a player to edit their price</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-2 text-left">
                                                <Checkbox
                                                    checked={selectedPlayers.length === players.data.length}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="p-2 text-left">
                                                <button
                                                    onClick={() => handleSort('name')}
                                                    className="flex items-center gap-1 hover:text-primary"
                                                >
                                                    Player
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </button>
                                            </th>
                                            <th className="p-2 text-left">Team</th>
                                            <th className="p-2 text-left">Position</th>
                                            <th className="p-2 text-left">#</th>
                                            <th className="p-2 text-right">
                                                <button
                                                    onClick={() => handleSort('price')}
                                                    className="flex items-center gap-1 hover:text-primary ml-auto"
                                                >
                                                    Price
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </button>
                                            </th>
                                            <th className="p-2 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {players.data.map((player) => (
                                            <tr key={player.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2">
                                                    <Checkbox
                                                        checked={selectedPlayers.includes(player.id)}
                                                        onCheckedChange={() => togglePlayer(player.id)}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center gap-3">
                                                        {player.photo_url ? (
                                                            <img
                                                                src={player.photo_url}
                                                                alt={player.name}
                                                                className="h-10 w-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                                {player.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <span className="font-medium">{player.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-2 text-sm text-muted-foreground">{player.team.name}</td>
                                                <td className="p-2 text-sm">{player.position}</td>
                                                <td className="p-2 text-sm">{player.jersey_number || '-'}</td>
                                                <td className="p-2 text-right">
                                                    {player.price ? (
                                                        <span className="font-bold">${(player.price / 1000000).toFixed(1)}M</span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground italic">Not set</span>
                                                    )}
                                                    {!player.is_active && (
                                                        <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEditDialog(player)}
                                                    >
                                                        <DollarSign className="mr-1 h-3 w-3" />
                                                        Edit Price
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <Pagination pagination={players} onPageChange={(page) => updateFilters({ page })} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Price Dialog */}
            <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Player Price</DialogTitle>
                        <DialogDescription>Update the price for {editingPlayer?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="price">Price (in millions)</Label>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-2xl">$</span>
                            <Input
                                id="price"
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="50"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="text-lg"
                            />
                            <span className="text-2xl">M</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Current: ${editingPlayer && (editingPlayer.price / 1000000).toFixed(1)}M
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingPlayer(null)}>
                            Cancel
                        </Button>
                        <Button onClick={updatePrice}>Update Price</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Update Dialog */}
            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Prices by Performance</DialogTitle>
                        <DialogDescription>
                            This will automatically adjust prices for {selectedPlayers.length} selected players based on their recent performance stats.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={bulkUpdatePrices}>Update Prices</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Prices Dialog */}
            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Player Prices</DialogTitle>
                        <DialogDescription>
                            Set all {selectedPlayers.length} selected players to the same base price.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="resetPrice">Base Price (in millions)</Label>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-2xl">$</span>
                            <Input
                                id="resetPrice"
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="50"
                                value={(parseFloat(resetPrice) / 1000000).toString()}
                                onChange={(e) => setResetPrice((parseFloat(e.target.value) * 1000000).toString())}
                                className="text-lg"
                            />
                            <span className="text-2xl">M</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={resetPrices}>Reset Prices</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
