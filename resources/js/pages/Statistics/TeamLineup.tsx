import PlayerStatsModal from '@/components/PlayerStatsModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { CheckCircle2, Loader2, Sparkles, Star, Trophy, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Player {
    id: number;
    name: string;
    position: 'Guard' | 'Forward' | 'Center';
    price: number;
    photo_url: string | null;
    photo_headshot_url: string | null;
    team: {
        id: number;
        name: string;
    };
}

interface FantasyTeamPlayer {
    id: number;
    fantasy_team_id: number;
    player_id: number;
    lineup_position: number | null;
    is_captain: boolean;
    purchase_price: number;
    points_earned: number;
    round_fantasy_points?: number;
    round_team_points?: number;
    multiplier?: number;
    player: Player;
}

interface FantasyTeam {
    id: number;
    team_name: string;
    user: {
        id: number;
        name: string;
    };
    fantasyLeague: {
        id: number;
        name: string;
        championship: {
            id: number;
            name: string;
        };
    };
}

interface RoundPoints {
    round: number;
    points: number;
}

interface LineupData {
    team: FantasyTeam;
    team_players: FantasyTeamPlayer[];
    lineup_type: '2-2-1' | '3-1-1' | '1-3-1';
    round_total_points: number | null;
}

interface Props {
    team: FantasyTeam;
    roundStats: RoundPoints | null;
    allRounds: number[];
}

type LineupType = '2-2-1' | '3-1-1' | '1-3-1' | '1-2-2' | '2-1-2';

interface LineupConfig {
    guards: number;
    forwards: number;
    centers: number;
    label: string;
}

const LINEUP_CONFIGS: Record<LineupType, LineupConfig> = {
    '2-2-1': { guards: 2, forwards: 2, centers: 1, label: '2 Guards, 2 Forwards, 1 Center' },
    '3-1-1': { guards: 3, forwards: 1, centers: 1, label: '3 Guards, 1 Forward, 1 Center' },
    '1-3-1': { guards: 1, forwards: 3, centers: 1, label: '1 Guard, 3 Forwards, 1 Center' },
    '1-2-2': { guards: 1, forwards: 2, centers: 2, label: '1 Guard, 2 Forwards, 2 Centers' },
    '2-1-2': { guards: 2, forwards: 1, centers: 2, label: '2 Guards, 1 Forward, 2 Centers' },
};

export default function TeamLineup({ team, roundStats, allRounds }: Props) {
    console.log('TeamLineup props:', { team, roundStats, allRounds });
    const [selectedRound, setSelectedRound] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [lineupData, setLineupData] = useState<LineupData | null>(null);

    // Player stats modal state
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [selectedPlayerStats, setSelectedPlayerStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Set initial round to the latest finished round
    useEffect(() => {
        if (allRounds.length > 0 && selectedRound === null) {
            setSelectedRound(allRounds[allRounds.length - 1]);
        }
    }, [allRounds]);

    // Load lineup data when round changes
    useEffect(() => {
        if (selectedRound !== null) {
            loadLineupData(selectedRound);
        }
    }, [selectedRound]);

    const loadLineupData = async (round: number) => {
        setLoading(true);
        try {
            const response = await axios.get<LineupData>(`/statistics/teams/${team.id}/lineup/${round}`);
            setLineupData(response.data);
        } catch (error) {
            console.error('Failed to load lineup data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!lineupData || loading) {
        return (
            <AuthenticatedLayout>
                <Head title={`${team.team_name} - Lineup`} />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="text-primary h-8 w-8 animate-spin" />
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const starters = lineupData.team_players.filter((p) => p.lineup_position && p.lineup_position >= 1 && p.lineup_position <= 5);
    const sixthMan = lineupData.team_players.find((p) => p.lineup_position === 6);
    const bench = lineupData.team_players.filter((p) => !p.lineup_position || p.lineup_position > 6);
    const captain = lineupData.team_players.find((p) => p.is_captain);
    const lineupType = lineupData.lineup_type || '2-2-1';
    const config = LINEUP_CONFIGS[lineupType];

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
    const getSlotPosition = (slotIndex: number, config: LineupConfig): 'Guard' | 'Forward' | 'Center' => {
        if (slotIndex < config.guards) return 'Guard';
        if (slotIndex < config.guards + config.forwards) return 'Forward';
        return 'Center';
    };

    const getCourtPosition = (slotIndex: number, config: LineupConfig): { left: string; top: string } => {
        if (slotIndex < config.guards) {
            const guardIndex = slotIndex;
            const top = '85%';

            if (config.guards === 1) {
                return { left: '50%', top };
            } else if (config.guards === 2) {
                return { left: guardIndex === 0 ? '25%' : '75%', top };
            } else {
                const positions = ['16.67%', '50%', '83.33%'];
                return { left: positions[guardIndex], top };
            }
        }

        if (slotIndex < config.guards + config.forwards) {
            const forwardIndex = slotIndex - config.guards;
            const top = '50%';

            if (config.forwards === 1) {
                return { left: '50%', top };
            } else if (config.forwards === 2) {
                return { left: forwardIndex === 0 ? '25%' : '75%', top };
            } else {
                const positions = ['16.67%', '50%', '83.33%'];
                return { left: positions[forwardIndex], top };
            }
        }

        const centerIndex = slotIndex - config.guards - config.forwards;
        const top = '15%';

        if (config.centers === 1) {
            return { left: '50%', top };
        } else {
            return { left: centerIndex === 0 ? '25%' : '75%', top };
        }
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
        <AuthenticatedLayout>
            <Head title={`${team.team_name} - Lineup`} />
            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                                <div>
                                    <CardTitle className="flex items-center gap-3 text-2xl">
                                        <Trophy className="h-6 w-6" />
                                        {`Round ${selectedRound} Performance`}
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        {team.team_name} - {/* league.name */}
                                    </CardDescription>
                                </div>
                                <div className="flex w-full items-center gap-3 sm:w-auto">
                                    <select
                                        value={selectedRound?.toString()}
                                        onChange={(e) => { setSelectedRound(parseInt(e.target.value)); }}
                                        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-40"
                                    >
                                        {allRounds.map((round) => (
                                            <option key={round} value={round.toString()}>
                                                Round {round}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {roundStats !== null && (
                                <Alert className="mb-4 border-green-500 bg-green-50">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        <strong>Round {selectedRound} Total:</strong> {roundStats.points} points (after position multipliers)
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Basketball Court */}
                        <div className="lg:col-span-8">
                            {/* Header */}
                            <div className="mb-4">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    Starting Five:
                                    <span className="rounded bg-green-600 px-2 py-0.5 text-sm font-normal text-white">100%</span>
                                </h2>
                            </div>

                            {/* Court */}
                            <div
                                className="relative overflow-hidden rounded-lg border-4 border-gray-300 pt-10 shadow-2xl dark:border-gray-800"
                                style={{
                                    backgroundImage: 'url(/images/basketball-court-light.png)',
                                    backgroundColor: '#1f2937',
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center',
                                    paddingBottom: '75%',
                                    position: 'relative',
                                }}
                            >
                                <div
                                    className="absolute inset-0 bg-[url('/images/basketball-court-light.png')] dark:bg-[url('/images/basketball-court.png')]"
                                    style={{
                                        backgroundSize: 'contain',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center',
                                    }}
                                ></div>
                                <div className="absolute inset-0 bg-white/10 dark:bg-black/20"></div>

                                <div className="absolute inset-0 z-10">
                                    {[0, 1, 2, 3, 4].map((slotIndex) => {
                                        const config = lineupType ? LINEUP_CONFIGS[lineupType] : LINEUP_CONFIGS['2-2-1'];
                                        const slotPosition = getSlotPosition(slotIndex, config);
                                        const player = starters.find((p) => p.lineup_position === slotIndex + 1);
                                        const position = getCourtPosition(slotIndex, config);

                                        return (
                                            <div
                                                key={slotIndex}
                                                className={`absolute flex h-24 w-16 flex-col items-center justify-center rounded-lg border-2 transition-all sm:h-36 sm:w-28 md:h-36 md:w-28 lg:h-40 lg:w-32 ${player ? 'border-gray-400 bg-gradient-to-br from-white to-gray-50 dark:border-white/60 dark:from-gray-900 dark:to-gray-800' : 'border-dashed border-gray-400/50 bg-white/50 dark:border-white/30 dark:bg-black/40'}  `}
                                                style={{
                                                    left: position.left,
                                                    top: position.top,
                                                    transform: 'translate(-50%, -50%)',
                                                }}
                                            >
                                                {player ? (
                                                    <div className="relative flex w-full cursor-move flex-col items-center gap-1 p-1 sm:p-4">
                                                        <div
                                                            className={`absolute -top-2 left-1/2 -translate-x-1/2 ${getPositionColor(player.player.position)} rounded px-1 py-0 text-[10px] font-bold text-white sm:px-2 sm:text-xs`}
                                                        >
                                                            {player.player.position}
                                                        </div>

                                                        {/* Played indicator */}

                                                        <div className="absolute -bottom-2 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-green-500 px-1 py-0.5 text-[8px] font-bold text-white sm:px-2 sm:text-[10px]">
                                                            ✓ {(player.round_fantasy_points ?? 0).toFixed(1)} FP
                                                        </div>

                                                        {/* Captain Star */}
                                                        <button
                                                            className="absolute -right-2 -top-2 z-10 cursor-pointer transition-transform hover:scale-110"
                                                            title={captain?.id === player.id ? 'Remove Captain' : 'Make Captain'}
                                                        >
                                                            <Star
                                                                className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                                                    captain?.id === player.id
                                                                        ? 'fill-purple-500 text-purple-500'
                                                                        : 'fill-gray-300 text-gray-400 hover:fill-purple-300 hover:text-purple-400'
                                                                }`}
                                                            />
                                                        </button>

                                                        {/* Captain indicator for finished/locked rounds */}
                                                        {player.is_captain && (
                                                            <div className="absolute -right-1 -top-1 z-10 sm:-right-2 sm:-top-2">
                                                                <Star className="h-4 w-4 fill-purple-500 text-purple-500 sm:h-5 sm:w-5" />
                                                            </div>
                                                        )}

                                                        {player.player.photo_headshot_url || player.player.photo_url ? (
                                                            <img
                                                                src={(player.player.photo_headshot_url || player.player.photo_url)!}
                                                                alt={player.player.name}
                                                                className="h-8 w-8 rounded-full border-2 border-white/80 object-cover object-top sm:h-12 sm:w-12 md:h-14 md:w-14"
                                                            />
                                                        ) : (
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-gray-700 sm:h-12 sm:w-12 md:h-14 md:w-14">
                                                                <User className="h-4 w-4 text-gray-300 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                                                            </div>
                                                        )}
                                                        <div className="w-full text-center">
                                                            <div
                                                                className="hover:text-primary cursor-pointer truncate text-[9px] font-bold text-gray-900 transition-colors sm:text-xs dark:text-white"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    showPlayerStats(player.player.id);
                                                                }}
                                                            >
                                                                {player.player.name}
                                                            </div>
                                                            <div className="hidden truncate text-[8px] text-gray-600 sm:block sm:text-[10px] dark:text-gray-300">
                                                                {player.player.team.name}
                                                            </div>
                                                            <div className="mt-0.5 text-[9px] sm:text-xs">
                                                                <div
                                                                    className={`font-bold ${player.is_captain ? 'text-purple-400' : 'text-green-400'}`}
                                                                >
                                                                    {player.round_team_points?.toFixed(2)} pts
                                                                </div>
                                                                <div className="text-[7px] text-gray-400 sm:text-[8px]">
                                                                    {player.round_fantasy_points?.toFixed(1)} FP ×{' '}
                                                                    {((player.multiplier || 0.5) * 100).toFixed(0)}%{player.is_captain && ' (C)'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-1 text-center text-[10px] text-gray-500 sm:p-2 sm:text-xs dark:text-white/50">
                                                        <Users className="mx-auto mb-1 h-6 w-6 opacity-50 sm:h-8 sm:w-8" />
                                                        <span className="text-[9px] font-medium sm:text-xs">{slotPosition}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Mobile-only: Bench & Substitutes Horizontal Scroll */}
                        <Card className="lg:hidden">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm">Bench & Substitutes</CardTitle>
                                <CardDescription className="text-xs">6th man: 75%, Bench: 50% points</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-2">
                                    {/* Sixth Man Card */}
                                    {sixthMan ? (
                                        <div
                                            key={`sixth-${sixthMan.player.id}`}
                                            className="w-28 flex-shrink-0 cursor-move rounded-lg border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 p-2 dark:from-yellow-900/20 dark:to-amber-900/20"
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                {sixthMan.player.photo_headshot_url || sixthMan.player.photo_url ? (
                                                    <img
                                                        src={(sixthMan.player.photo_headshot_url || sixthMan.player.photo_url)!}
                                                        alt={sixthMan.player.name}
                                                        className="h-14 w-14 rounded-full border-2 border-yellow-400 object-cover object-top"
                                                    />
                                                ) : (
                                                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-yellow-400 bg-gray-200">
                                                        <User className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="w-full text-center">
                                                    <div
                                                        className="hover:text-primary cursor-pointer truncate text-xs font-medium transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            showPlayerStats(sixthMan.player.id);
                                                        }}
                                                    >
                                                        {sixthMan.player.name}
                                                    </div>
                                                    <Badge className="mt-1 flex items-center justify-center gap-1 bg-yellow-500 text-[10px] text-white">
                                                        <Sparkles className="h-2 w-2" />
                                                        6th
                                                    </Badge>
                                                    <div className="mt-1 text-[10px]">
                                                        <div className="font-bold text-yellow-600">{sixthMan.round_team_points?.toFixed(1)} pts</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-28 flex-shrink-0 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-2 dark:border-gray-600">
                                            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                                                <Sparkles className="mb-1 h-8 w-8 opacity-50" />
                                                <span className="text-[10px]">6th Man</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Regular Bench Players */}
                                    {bench
                                        .filter((p) => p.id !== sixthMan?.id)
                                        .map((player) => (
                                            <div
                                                key={player.player.id}
                                                className="w-28 flex-shrink-0 cursor-move rounded-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-2 dark:from-blue-900/20 dark:to-indigo-900/20"
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    {player.player.photo_headshot_url || player.player.photo_url ? (
                                                        <img
                                                            src={(player.player.photo_headshot_url || player.player.photo_url)!}
                                                            alt={player.player.name}
                                                            className="h-14 w-14 rounded-full border-2 border-blue-300 object-cover object-top"
                                                        />
                                                    ) : (
                                                        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-300 bg-gray-200">
                                                            <User className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="w-full text-center">
                                                        <div
                                                            className="hover:text-primary cursor-pointer truncate text-xs font-medium transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                showPlayerStats(player.player.id);
                                                            }}
                                                        >
                                                            {player.player.name}
                                                        </div>
                                                        <Badge className="mt-1 text-[10px]">{player.player.position}</Badge>
                                                        <div className="mt-1 text-[10px]">
                                                            <div className="font-bold text-blue-600">{player.round_team_points?.toFixed(1)} pts</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    {bench.length === 0 && !sixthMan && (
                                        <div className="w-full py-4 text-center text-sm text-muted-foreground">No bench players</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Mobile-only: Captain */}
                        <Card className="lg:hidden">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <Star className="h-4 w-4 text-purple-500" />
                                    Team Captain
                                    <Badge className="bg-purple-600 text-xs text-white">200%</Badge>
                                </CardTitle>
                                <CardDescription className="text-xs">Choose a starter as captain - earns 200% points</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`relative flex min-h-[120px] flex-col items-center rounded-lg border-2 p-3 transition-all ${captain ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20' : 'border-dashed border-gray-300 bg-white/50 dark:border-gray-600 dark:bg-gray-800/50'} `}
                                >
                                    {captain ? (
                                        <div className="flex w-full flex-col items-center gap-1">
                                            <div className="relative">
                                                {captain.player.photo_headshot_url || captain.player.photo_url ? (
                                                    <img
                                                        src={(captain.player.photo_headshot_url || captain.player.photo_url)!}
                                                        alt={captain.player.name}
                                                        className="h-16 w-16 rounded-full border-2 border-purple-400 object-cover object-top"
                                                    />
                                                ) : (
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-purple-400 bg-gray-200">
                                                        <User className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="absolute -right-1 -top-1">
                                                    <Star className="h-6 w-6 fill-purple-500 text-purple-500" />
                                                </div>
                                            </div>
                                            <div className="w-full text-center">
                                                <div className="truncate text-xs font-bold">{captain.player.name}</div>
                                                <Badge className="mt-1 bg-purple-500 text-[10px] text-white">Captain</Badge>

                                                <div className="mt-1 text-[10px]">
                                                    <div className="font-bold text-purple-600">{captain.round_team_points?.toFixed(1)} pts</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center text-center text-xs text-muted-foreground">
                                            <Star className="mb-1 h-6 w-6 opacity-50" />
                                            <span>No captain selected</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Desktop: Captain + Available Players */}
                        <div className="hidden space-y-6 lg:col-span-4 lg:block">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Star className="h-5 w-5 text-purple-500" />
                                        Team Captain
                                        <Badge className="bg-purple-600 text-white">200%</Badge>
                                    </CardTitle>
                                    <CardDescription>Choose a starter as captain - earns 200% of fantasy points</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className={`relative flex min-h-[140px] flex-col items-center rounded-lg border-2 p-4 transition-all ${captain ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20' : 'border-dashed border-gray-300 bg-white/50 dark:border-gray-600 dark:bg-gray-800/50'} `}
                                    >
                                        {captain ? (
                                            <div className="flex w-full flex-col items-center gap-2 p-2">
                                                <div className="relative">
                                                    {captain.player.photo_headshot_url || captain.player.photo_url ? (
                                                        <img
                                                            src={(captain.player.photo_headshot_url || captain.player.photo_url)!}
                                                            alt={captain.player.name}
                                                            className="h-20 w-20 rounded-full border-4 border-purple-400 object-cover object-top"
                                                        />
                                                    ) : (
                                                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-purple-400 bg-gray-200">
                                                            <User className="h-10 w-10 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="absolute -right-2 -top-2">
                                                        <Star className="h-8 w-8 fill-purple-500 text-purple-500 drop-shadow-lg" />
                                                    </div>
                                                </div>
                                                <div className="w-full text-center">
                                                    <div className="truncate text-base font-bold">{captain.player.name}</div>
                                                    <div className="truncate text-xs text-muted-foreground">{captain.player.team.name}</div>
                                                    <div className="mt-1 flex items-center justify-center gap-2">
                                                        <Badge className="text-xs">{captain.player.position}</Badge>
                                                        <Badge className="bg-purple-500 text-xs text-white">Captain</Badge>
                                                    </div>
                                                    <div className="mt-2 text-sm">
                                                        <div className="font-bold text-purple-600">{captain.round_team_points?.toFixed(2)} pts</div>
                                                        <div className="text-[10px] text-gray-600">
                                                            {captain.round_fantasy_points?.toFixed(1)} FP × 200%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                                                <Star className="mb-2 h-8 w-8 opacity-50" />
                                                <span className="font-medium">No Captain Selected</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">Bench & Substitutes</CardTitle>
                                    <CardDescription>Sixth man earns 75%, bench players earn 50% of fantasy points</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="max-h-[600px] space-y-3 overflow-y-auto">
                                        {/* Sixth Man Section */}
                                        <div
                                            className={`rounded-lg border-2 p-3 transition-all ${sixthMan ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20' : 'border-dashed border-gray-300 dark:border-gray-600'} `}
                                        >
                                            {sixthMan ? (
                                                <div className="flex cursor-move items-center gap-3">
                                                    {sixthMan.player.photo_headshot_url || sixthMan.player.photo_url ? (
                                                        <img
                                                            src={(sixthMan.player.photo_headshot_url || sixthMan.player.photo_url)!}
                                                            alt={sixthMan.player.name}
                                                            className="h-12 w-12 flex-shrink-0 rounded-full border-2 border-yellow-400 object-cover object-top"
                                                        />
                                                    ) : (
                                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-yellow-400 bg-muted">
                                                            <User className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="hover:text-primary cursor-pointer truncate text-sm font-medium transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    showPlayerStats(sixthMan.player.id);
                                                                }}
                                                            >
                                                                {sixthMan.player.name}
                                                            </div>
                                                            <Badge className="flex items-center gap-1 bg-yellow-500 text-xs text-white">
                                                                <Sparkles className="h-3 w-3" />
                                                                6th Man
                                                            </Badge>
                                                        </div>
                                                        <div className="truncate text-xs text-muted-foreground">{sixthMan.player.team.name}</div>
                                                        <div className="mt-1 flex gap-2">
                                                            <Badge className={`${getPositionColor(sixthMan.player.position)} text-xs text-white`}>
                                                                {sixthMan.player.position}
                                                            </Badge>

                                                            <Badge className="bg-green-500 text-xs text-white">✓ Played</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 text-right">
                                                        <>
                                                            <div className="text-xs font-bold text-yellow-600">
                                                                {sixthMan.round_team_points?.toFixed(2)} pts
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                {sixthMan.round_fantasy_points?.toFixed(1)} FP × 75%
                                                            </div>
                                                        </>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-4 text-center text-xs text-muted-foreground">
                                                    <Sparkles className="mx-auto mb-1 h-6 w-6 opacity-50" />
                                                    <span>No sixth man selected for this round</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Regular Bench Players */}
                                        {bench.length === 0 && !sixthMan ? (
                                            <div className="py-8 text-center text-sm text-muted-foreground">All players assigned</div>
                                        ) : (
                                            bench
                                                .filter((p) => p.id !== sixthMan?.id)
                                                .map((teamPlayer) => (
                                                    <div
                                                        key={teamPlayer.id}
                                                        className="flex cursor-move items-center gap-3 rounded-lg border bg-white p-3 transition-all hover:bg-muted/50 dark:border-gray-700 dark:bg-gray-800/50"
                                                    >
                                                        {teamPlayer.player.photo_headshot_url || teamPlayer.player.photo_url ? (
                                                            <img
                                                                src={(teamPlayer.player.photo_headshot_url || teamPlayer.player.photo_url)!}
                                                                alt={teamPlayer.player.name}
                                                                className="h-12 w-12 flex-shrink-0 rounded-full object-cover object-top"
                                                            />
                                                        ) : (
                                                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                                                                <User className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <div
                                                                className="hover:text-primary cursor-pointer truncate text-sm font-medium transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    showPlayerStats(teamPlayer.player.id);
                                                                }}
                                                            >
                                                                {teamPlayer.player.name}
                                                            </div>
                                                            <div className="truncate text-xs text-muted-foreground">
                                                                {teamPlayer.player.team.name}
                                                            </div>
                                                            <div className="mt-1 flex gap-2">
                                                                <Badge
                                                                    className={`${getPositionColor(teamPlayer.player.position)} text-xs text-white`}
                                                                >
                                                                    {teamPlayer.player.position}
                                                                </Badge>

                                                                <Badge className="bg-green-500 text-xs text-white">✓ Played</Badge>
                                                            </div>
                                                        </div>
                                                        <div className="flex-shrink-0 text-right">
                                                            <>
                                                                <div className="text-xs font-bold text-blue-600">
                                                                    {teamPlayer.round_team_points?.toFixed(2)} pts
                                                                </div>
                                                                <div className="text-[10px] text-gray-500">
                                                                    {teamPlayer.round_fantasy_points?.toFixed(1)} FP × 50%
                                                                </div>
                                                            </>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
            <PlayerStatsModal
                player={selectedPlayerStats}
                loading={loadingStats}
                open={statsModalOpen}
                onOpenChange={(open) => {
                    setStatsModalOpen(open);
                    if (!open) {
                        setSelectedPlayerStats(null);
                    }
                }}
            />
        </AuthenticatedLayout>
    );
}
