import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlayerGameStat {
    round: number;
    game_date: string;
    opponent: string;
    minutes: number | null;
    points: number | null;
    rebounds: number | null;
    assists: number | null;
    steals: number | null;
    blocks: number | null;
    turnovers: number | null;
    fantasy_points: number | null;
    price: number | null;
}

interface Player {
    id: number;
    name: string;
    position: string;
    team_name: string;
    photo_url: string | null;
    photo_headshot_url?: string | null;
    price: number;
    stats: PlayerGameStat[];
}

interface PlayerStatsModalProps {
    player: Player | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loading?: boolean;
}

export default function PlayerStatsModal({ player, open, onOpenChange, loading = false }: PlayerStatsModalProps) {
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

    const getTrend = (current: number, previous: number) => {
        if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-gray-400" />;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                {loading ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Loading...</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    </>
                ) : !player ? null : (
                    <>
                        <DialogHeader>
                            <div className="flex items-start gap-4">
                                {(player.photo_headshot_url || player.photo_url) ? (
                                    <img
                                        src={(player.photo_headshot_url || player.photo_url)!}
                                        alt={player.name}
                                        className="w-16 h-16 rounded-full border-2 border-primary object-cover object-top"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                                        {player.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <DialogTitle className="text-2xl truncate">{player.name}</DialogTitle>
                                    <div className="mt-1 flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                                        <Badge className={`${getPositionColor(player.position)} text-white`}>
                                            {player.position}
                                        </Badge>
                                        <span className="text-muted-foreground truncate">{player.team_name}</span>
                                        <span className="font-semibold text-foreground whitespace-nowrap">
                                            €{(player.price / 1000000).toFixed(2)}M
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-6 min-w-0">
                            {/* Performance Chart */}
                            {player.stats && player.stats.length > 0 && (
                                <div className="min-w-0">
                                    <h3 className="mb-3 text-lg font-semibold">Performance Trend</h3>
                                    <div className="overflow-x-auto -mx-6 px-6">
                                        <div className="min-w-[500px]">
                                            <ResponsiveContainer width="100%" height={250}>
                                                <LineChart data={player.stats}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="round" label={{ value: 'Round', position: 'insideBottom', offset: -5 }} />
                                                    <YAxis label={{ value: 'Fantasy Points', angle: -90, position: 'insideLeft' }} />
                                                    <Tooltip
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const stat = payload[0].payload as PlayerGameStat;
                                                                return (
                                                                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                                                                        <p className="font-semibold">Round {stat.round}</p>
                                                                        <p className="text-sm">
                                                                            Fantasy Points: <span className="font-semibold">{(Number(stat.fantasy_points) || 0).toFixed(2)}</span>
                                                                        </p>
                                                                        <p className="text-sm">
                                                                            Points: {stat.points || 0} | Rebounds: {stat.rebounds || 0} | Assists: {stat.assists || 0}
                                                                        </p>
                                                                        {stat.opponent && (
                                                                            <p className="text-sm text-muted-foreground">vs {stat.opponent}</p>
                                                                        )}
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

                            {/* Game Log */}
                            <div className="min-w-0">
                                <h3 className="font-semibold mb-3">Game-by-Game Stats ({player.stats?.length || 0} games)</h3>
                                {!player.stats || player.stats.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No games played yet this season
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto -mx-6 px-6">
                                        <div className="min-w-[600px] rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-16">Round</TableHead>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Opponent</TableHead>
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
                                                    {player.stats.map((stat, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell className="font-medium">{stat.round}</TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">
                                                                {new Date(stat.game_date).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </TableCell>
                                                            <TableCell className="text-sm">{stat.opponent}</TableCell>
                                                            <TableCell className="text-right font-bold text-primary">
                                                                {(Number(stat.fantasy_points) || 0).toFixed(1)}
                                                            </TableCell>
                                                            <TableCell className="text-right font-medium">{stat.points || 0}</TableCell>
                                                            <TableCell className="text-right">{stat.rebounds || 0}</TableCell>
                                                            <TableCell className="text-right">{stat.assists || 0}</TableCell>
                                                            <TableCell className="text-right">{stat.steals || 0}</TableCell>
                                                            <TableCell className="text-right">{stat.blocks || 0}</TableCell>
                                                            <TableCell className="text-right text-red-600">{stat.turnovers || 0}</TableCell>
                                                            <TableCell className="text-right">{stat.minutes || 0}</TableCell>
                                                            <TableCell className="text-center">
                                                                {index > 0 && getTrend(
                                                                    Number(stat.fantasy_points) || 0,
                                                                    Number(player.stats[index - 1].fantasy_points) || 0
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
