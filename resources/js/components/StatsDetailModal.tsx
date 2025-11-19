import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlayerStats {
    round: number;
    scheduled_at: string;
    fantasy_points: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    minutes_played: number;
}

interface Player {
    id: number;
    name: string;
    position: string;
    team: {
        name: string;
    };
    price: number;
    photo_url: string | null;
    photo_headshot_url: string | null;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'player' | null;
    data: {
        player?: Player;
        stats?: PlayerStats[];
    } | null;
    loading: boolean;
}

export default function StatsDetailModal({ open, onOpenChange, type, data, loading }: Props) {
    if (!type) return null;

    const getTrend = (current: number, previous: number) => {
        if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-gray-400" />;
    };

    const getPositionColor = (position: string) => {
        switch (position) {
            case 'Guard':
                return 'bg-blue-500';
            case 'Forward':
                return 'bg-amber-500';
            case 'Center':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                {loading ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Loading...</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader className="flex-shrink-0">
                            {type === 'player' && data?.player && (
                                <div className="flex items-center gap-4">
                                    {(data.player.photo_headshot_url || data.player.photo_url) && (
                                        <img
                                            src={(data.player.photo_headshot_url || data.player.photo_url)!}
                                            alt={data.player.name}
                                            className="h-16 w-16 rounded-full border-2 border-primary object-cover"
                                        />
                                    )}
                                    <div className="min-w-0">
                                        <DialogTitle className="text-2xl truncate">{data.player.name}</DialogTitle>
                                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                                            <Badge className={`${getPositionColor(data.player.position)} text-white`}>
                                                {data.player.position}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground truncate">{data.player.team?.name || 'N/A'}</span>
                                            <span className="text-sm font-semibold whitespace-nowrap">€{(data.player.price / 1000000).toFixed(2)}M</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </DialogHeader>

                        <div className="space-y-6 min-w-0">
                            {/* Chart */}
                            {type === 'player' && data?.stats && data.stats.length > 0 && (
                                <div className="min-w-0">
                                    <h3 className="mb-3 text-lg font-semibold">Performance Trend</h3>
                                    <div className="overflow-x-auto -mx-6 px-6">
                                        <div className="min-w-[500px]">
                                            <ResponsiveContainer width="100%" height={250}>
                                                <LineChart data={data.stats}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="round" label={{ value: 'Round', position: 'insideBottom', offset: -5 }} />
                                            <YAxis label={{ value: 'Fantasy Points', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const stat = payload[0].payload as PlayerStats;
                                                        return (
                                                            <div className="rounded-lg border bg-background p-3 shadow-lg">
                                                                <p className="font-semibold">Round {stat.round}</p>
                                                                <p className="text-sm">
                                                                    Fantasy Points: <span className="font-semibold">{stat.fantasy_points.toFixed(2)}</span>
                                                                </p>
                                                                <p className="text-sm">
                                                                    Points: {stat.points} | Rebounds: {stat.rebounds} | Assists: {stat.assists}
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Line type="monotone" dataKey="fantasy_points" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stats Table */}
                            {type === 'player' && data?.stats && data.stats.length > 0 && (
                                <div className="min-w-0">
                                    <h3 className="mb-3 text-lg font-semibold">Game-by-Game Stats</h3>
                                    <div className="overflow-x-auto -mx-6 px-6">
                                        <div className="min-w-[600px] rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Round</TableHead>
                                                    <TableHead className="text-right">FP</TableHead>
                                                    <TableHead className="text-right">PTS</TableHead>
                                                    <TableHead className="text-right">REB</TableHead>
                                                    <TableHead className="text-right">AST</TableHead>
                                                    <TableHead className="text-right">STL</TableHead>
                                                    <TableHead className="text-right">BLK</TableHead>
                                                    <TableHead className="text-right">TO</TableHead>
                                                    <TableHead className="text-right">MIN</TableHead>
                                                    <TableHead className="text-center">Trend</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.stats.map((stat, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{stat.round}</TableCell>
                                                        <TableCell className="text-right font-semibold">{stat.fantasy_points.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">{stat.points}</TableCell>
                                                        <TableCell className="text-right">{stat.rebounds}</TableCell>
                                                        <TableCell className="text-right">{stat.assists}</TableCell>
                                                        <TableCell className="text-right">{stat.steals}</TableCell>
                                                        <TableCell className="text-right">{stat.blocks}</TableCell>
                                                        <TableCell className="text-right">{stat.turnovers}</TableCell>
                                                        <TableCell className="text-right">{stat.minutes_played}</TableCell>
                                                        <TableCell className="text-center">
                                                            {index > 0 && data.stats && getTrend(stat.fantasy_points, data.stats[index - 1].fantasy_points)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {type === 'player' && (!data?.stats || data.stats.length === 0) && (
                                <div className="py-12 text-center text-muted-foreground">No statistics available for this player</div>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
