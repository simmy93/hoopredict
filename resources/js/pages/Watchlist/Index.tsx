import { usePage } from '@inertiajs/react';
import { PageProps, Player, User } from '@/types';

import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';

export default function WatchlistIndex() {
    const {
        props: { watchlist },
    } = usePage<PageProps<{ watchlist: Player[] }>>();

    const removeFromWatchlist = (player: Player) => {
        router.post(route('watchlist.toggle', { player: player.id }));
    };

    return (
        <AuthenticatedLayout
            title="Watchlist"
            header="Watchlist"
        >
            <Card>
                <CardHeader>
                    <CardTitle>Your Watchlist</CardTitle>
                    <CardDescription>
                        Players you are keeping an eye on.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Player</TableHead>
                                <TableHead>Team</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {watchlist.map((player) => (
                                <TableRow key={player.id}>
                                    <TableCell>{player.name}</TableCell>
                                    <TableCell>{player.team.name}</TableCell>
                                    <TableCell>{player.price}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="destructive"
                                            onClick={() =>
                                                removeFromWatchlist(player)
                                            }
                                        >
                                            Remove
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
