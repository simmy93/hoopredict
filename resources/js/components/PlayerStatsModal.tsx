import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
    price: number;
    stats: PlayerGameStat[];
}

interface PlayerStatsModalProps {
    player: Player | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function PlayerStatsModal({ player, open, onOpenChange }: PlayerStatsModalProps) {
    if (!player) return null;

    // Calculate averages
    const stats = player.stats || [];
    const avgFantasyPoints = stats.length > 0
        ? stats.reduce((sum, s) => sum + (Number(s.fantasy_points) || 0), 0) / stats.length
        : 0;
    const avgPoints = stats.length > 0
        ? stats.reduce((sum, s) => sum + (Number(s.points) || 0), 0) / stats.length
        : 0;
    const avgRebounds = stats.length > 0
        ? stats.reduce((sum, s) => sum + (Number(s.rebounds) || 0), 0) / stats.length
        : 0;
    const avgAssists = stats.length > 0
        ? stats.reduce((sum, s) => sum + (Number(s.assists) || 0), 0) / stats.length
        : 0;

    // Get price trend
    const priceHistory = stats.filter(s => s.price !== null).map(s => s.price!);
    const currentPrice = player.price;
    const previousPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1] : currentPrice;
    const priceDiff = currentPrice - previousPrice;
    const priceChange = previousPrice > 0 ? ((priceDiff / previousPrice) * 100).toFixed(1) : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        {player.photo_url ? (
                            <img
                                src={player.photo_url}
                                alt={player.name}
                                className="w-16 h-16 rounded-full object-cover object-top"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                                {player.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1">
                            <DialogTitle className="text-2xl">{player.name}</DialogTitle>
                            <div className="mt-1 flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                                <Badge variant="outline">{player.position}</Badge>
                                <span className="text-muted-foreground">{player.team_name}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="font-semibold text-foreground">{currentPrice}</span>
                                {priceDiff !== 0 && (
                                    <span className={`flex items-center gap-1 text-sm ${priceDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {priceDiff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {priceChange}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Season Averages */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                        <div className="text-sm text-muted-foreground">Avg Fantasy Points</div>
                        <div className="text-2xl font-bold">{avgFantasyPoints.toFixed(1)}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Avg Points</div>
                        <div className="text-2xl font-bold">{avgPoints.toFixed(1)}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Avg Rebounds</div>
                        <div className="text-2xl font-bold">{avgRebounds.toFixed(1)}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Avg Assists</div>
                        <div className="text-2xl font-bold">{avgAssists.toFixed(1)}</div>
                    </div>
                </div>

                {/* Game Log */}
                <div>
                    <h3 className="font-semibold mb-3">Game Log ({stats.length} games)</h3>
                    {stats.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No games played yet this season
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">R</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Opponent</TableHead>
                                        <TableHead className="text-right">MIN</TableHead>
                                        <TableHead className="text-right">PTS</TableHead>
                                        <TableHead className="text-right">REB</TableHead>
                                        <TableHead className="text-right">AST</TableHead>
                                        <TableHead className="text-right">STL</TableHead>
                                        <TableHead className="text-right">BLK</TableHead>
                                        <TableHead className="text-right">TO</TableHead>
                                        <TableHead className="text-right font-semibold">FP</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.map((stat, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{stat.round}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(stat.game_date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell className="text-sm">{stat.opponent}</TableCell>
                                            <TableCell className="text-right">{stat.minutes || 0}</TableCell>
                                            <TableCell className="text-right font-medium">{stat.points || 0}</TableCell>
                                            <TableCell className="text-right">{stat.rebounds || 0}</TableCell>
                                            <TableCell className="text-right">{stat.assists || 0}</TableCell>
                                            <TableCell className="text-right">{stat.steals || 0}</TableCell>
                                            <TableCell className="text-right">{stat.blocks || 0}</TableCell>
                                            <TableCell className="text-right text-red-600">{stat.turnovers || 0}</TableCell>
                                            <TableCell className="text-right font-bold text-primary">
                                                {(Number(stat.fantasy_points) || 0).toFixed(1)}
                                            </TableCell>
                                            <TableCell className="text-right text-sm">
                                                {stat.price ? stat.price : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
