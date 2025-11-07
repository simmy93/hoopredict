import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trophy, User, Sparkles, AlertCircle, CheckCircle2, Info, Users } from 'lucide-react';

interface User {
    id: number;
    name: string;
}

interface Team {
    id: number;
    name: string;
}

interface Player {
    id: number;
    name: string;
    position: string;
    price: number;
    photo_url: string | null;
    photo_headshot_url: string | null;
    team: Team;
}

interface FantasyTeamPlayer {
    id: number;
    fantasy_team_id: number;
    player_id: number;
    lineup_position: number | null;
    purchase_price: number;
    points_earned: number;
    player: Player;
    round_fantasy_points?: number;
    round_team_points?: number | null;
    multiplier?: number;
}

interface Championship {
    id: number;
    name: string;
    season: string;
}

interface FantasyLeague {
    id: number;
    name: string;
    mode: 'budget' | 'draft';
    team_size: number;
    championship: Championship;
}

interface FantasyTeam {
    id: number;
    team_name: string;
    budget_spent: number;
    budget_remaining: number;
    total_points: number;
    lineup_type: string | null;
    user: User;
}

interface PositionCounts {
    Guard: number;
    Forward: number;
    Center: number;
}

interface Props {
    league: FantasyLeague;
    userTeam: FantasyTeam;
    teamPlayers: FantasyTeamPlayer[];
    positionCounts: PositionCounts;
    startingLineupCounts: PositionCounts;
    hasValidTeamComposition: boolean;
    hasValidStartingLineup: boolean;
    selectedRound: number;
    allRounds: number[];
    isRoundFinished: boolean;
    roundTotalPoints: number | null;
    isRoundLocked: boolean;
    currentActiveRound: number | null;
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

export default function LineupTab({
    league,
    userTeam,
    teamPlayers: initialTeamPlayers,
    hasValidTeamComposition,
    selectedRound,
    allRounds,
    isRoundFinished,
    roundTotalPoints,
    isRoundLocked,
    currentActiveRound,
}: Props) {
    const [lineupType, setLineupType] = useState<LineupType | null>(
        (userTeam.lineup_type as LineupType) || null
    );
    const [starters, setStarters] = useState<(FantasyTeamPlayer | null)[]>([null, null, null, null, null]);
    const [sixthMan, setSixthMan] = useState<FantasyTeamPlayer | null>(null);
    const [bench, setBench] = useState<FantasyTeamPlayer[]>(initialTeamPlayers);
    const [draggedPlayer, setDraggedPlayer] = useState<FantasyTeamPlayer | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize lineup from database
    useEffect(() => {
        const startersFromDb = initialTeamPlayers
            .filter(p => p.lineup_position && p.lineup_position >= 1 && p.lineup_position <= 5)
            .sort((a, b) => (a.lineup_position || 0) - (b.lineup_position || 0));

        const sixthManFromDb = initialTeamPlayers
            .find(p => p.lineup_position === 6);

        const benchFromDb = initialTeamPlayers
            .filter(p => !p.lineup_position || p.lineup_position > 6);

        if (startersFromDb.length > 0) {
            const newStarters: (FantasyTeamPlayer | null)[] = [null, null, null, null, null];
            startersFromDb.forEach((player) => {
                if (player.lineup_position && player.lineup_position >= 1 && player.lineup_position <= 5) {
                    newStarters[player.lineup_position - 1] = player;
                }
            });
            setStarters(newStarters);
        }

        setSixthMan(sixthManFromDb || null);
        setBench(benchFromDb);
    }, [initialTeamPlayers]);

    // Validate lineup
    useEffect(() => {
        if (!lineupType) {
            setValidationErrors([]);
            return;
        }

        const config = LINEUP_CONFIGS[lineupType];
        const currentStarters = starters.filter(s => s !== null) as FantasyTeamPlayer[];

        if (currentStarters.length < 5) {
            setValidationErrors([`Need ${5 - currentStarters.length} more players in starting lineup`]);
            return;
        }

        const counts = {
            Guard: currentStarters.filter(p => p.player.position === 'Guard').length,
            Forward: currentStarters.filter(p => p.player.position === 'Forward').length,
            Center: currentStarters.filter(p => p.player.position === 'Center').length,
        };

        const errors = [];
        if (counts.Guard !== config.guards) {
            errors.push(`Need exactly ${config.guards} Guard(s), have ${counts.Guard}`);
        }
        if (counts.Forward !== config.forwards) {
            errors.push(`Need exactly ${config.forwards} Forward(s), have ${counts.Forward}`);
        }
        if (counts.Center !== config.centers) {
            errors.push(`Need exactly ${config.centers} Center(s), have ${counts.Center}`);
        }

        setValidationErrors(errors);
    }, [starters, lineupType]);

    // Handle lineup type change
    const handleLineupTypeChange = (type: string) => {
        const newType = type as LineupType;
        const oldType = lineupType;
        setLineupType(newType);

        if (oldType && oldType !== newType) {
            const newConfig = LINEUP_CONFIGS[newType];
            const newStarters: (FantasyTeamPlayer | null)[] = [null, null, null, null, null];
            const playersToReturn: FantasyTeamPlayer[] = [];

            const currentGuards = starters.filter(p => p?.player.position === 'Guard').filter((p): p is FantasyTeamPlayer => p !== null);
            const currentForwards = starters.filter(p => p?.player.position === 'Forward').filter((p): p is FantasyTeamPlayer => p !== null);
            const currentCenters = starters.filter(p => p?.player.position === 'Center').filter((p): p is FantasyTeamPlayer => p !== null);

            let slotIndex = 0;

            for (let i = 0; i < newConfig.guards; i++) {
                if (currentGuards[i]) {
                    newStarters[slotIndex] = currentGuards[i];
                }
                slotIndex++;
            }
            for (let i = newConfig.guards; i < currentGuards.length; i++) {
                playersToReturn.push(currentGuards[i]);
            }

            for (let i = 0; i < newConfig.forwards; i++) {
                if (currentForwards[i]) {
                    newStarters[slotIndex] = currentForwards[i];
                }
                slotIndex++;
            }
            for (let i = newConfig.forwards; i < currentForwards.length; i++) {
                playersToReturn.push(currentForwards[i]);
            }

            for (let i = 0; i < newConfig.centers; i++) {
                if (currentCenters[i]) {
                    newStarters[slotIndex] = currentCenters[i];
                }
                slotIndex++;
            }
            for (let i = newConfig.centers; i < currentCenters.length; i++) {
                playersToReturn.push(currentCenters[i]);
            }

            setStarters(newStarters);
            setBench([...bench, ...playersToReturn]);
        }
    };

    // Drag handlers
    const handleDragStart = (player: FantasyTeamPlayer) => {
        if (isRoundLocked || isRoundFinished) return;
        setDraggedPlayer(player);
    };

    const handleDragEnd = () => {
        setDraggedPlayer(null);
    };

    const handleDropOnSlot = (slotIndex: number) => {
        if (!draggedPlayer || !lineupType || isRoundLocked || isRoundFinished) return;

        const config = LINEUP_CONFIGS[lineupType];
        const slotPosition = getSlotPosition(slotIndex, config);

        if (draggedPlayer.player.position !== slotPosition) {
            return;
        }

        const newStarters = [...starters];
        const oldSlotIndex = newStarters.findIndex(s => s?.id === draggedPlayer.id);
        if (oldSlotIndex !== -1) {
            newStarters[oldSlotIndex] = null;
        }

        const newBench = bench.filter(p => p.id !== draggedPlayer.id);

        if (sixthMan?.id === draggedPlayer.id) {
            setSixthMan(null);
        }

        newStarters[slotIndex] = draggedPlayer;

        setStarters(newStarters);
        setBench(newBench);
        setDraggedPlayer(null);
    };

    const handleDropOnBench = () => {
        if (!draggedPlayer || isRoundLocked || isRoundFinished) return;

        const newStarters = [...starters];
        const slotIndex = newStarters.findIndex(s => s?.id === draggedPlayer.id);
        if (slotIndex !== -1) {
            newStarters[slotIndex] = null;
            setStarters(newStarters);
        }

        if (sixthMan?.id === draggedPlayer.id) {
            setSixthMan(null);
        }

        if (!bench.find(p => p.id === draggedPlayer.id)) {
            setBench([...bench, draggedPlayer]);
        }

        setDraggedPlayer(null);
    };

    const handleDropOnSixthMan = () => {
        if (!draggedPlayer || isRoundLocked || isRoundFinished) return;

        const newStarters = [...starters];
        const slotIndex = newStarters.findIndex(s => s?.id === draggedPlayer.id);
        if (slotIndex !== -1) {
            newStarters[slotIndex] = null;
            setStarters(newStarters);
        }

        const newBench = bench.filter(p => p.id !== draggedPlayer.id);

        if (sixthMan) {
            newBench.push(sixthMan);
        }

        setSixthMan(draggedPlayer);
        setBench(newBench);
        setDraggedPlayer(null);
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
            case 'Guard': return 'bg-blue-500';
            case 'Forward': return 'bg-amber-500';
            case 'Center': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const handleSave = () => {
        if (validationErrors.length > 0 || !lineupType) return;

        setIsSaving(true);

        const lineup = starters
            .filter(s => s !== null)
            .map(s => s!.player.id);

        router.post(`/fantasy/leagues/${league.id}/lineup`, {
            lineup,
            lineup_type: lineupType,
            sixth_man: sixthMan?.player.id || null
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSaving(false);
            },
            onError: () => {
                setIsSaving(false);
            }
        });
    };

    const isValidLineup = validationErrors.length === 0 && lineupType !== null && starters.every(s => s !== null);

    return (
        <>
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-3">
                                <Trophy className="h-6 w-6" />
                                {isRoundFinished ? `Round ${selectedRound} Performance` : 'Manage Lineup'}
                            </CardTitle>
                            <CardDescription className="mt-2">
                                {userTeam.team_name} - {league.name}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <select
                                value={selectedRound.toString()}
                                onChange={(e) => {
                                    router.get(`/fantasy/leagues/${league.id}/team`, { round: e.target.value }, { preserveState: true });
                                }}
                                className="flex h-9 w-full sm:w-40 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {allRounds.map((round) => (
                                    <option key={round} value={round.toString()}>
                                        Round {round}
                                    </option>
                                ))}
                            </select>

                            {!isRoundFinished && !isRoundLocked && (
                                <Button
                                    onClick={handleSave}
                                    disabled={!isValidLineup || isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save Lineup'}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isRoundFinished && roundTotalPoints !== null && (
                        <Alert className="mb-4 border-green-500 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                <strong>Round {selectedRound} Total:</strong> {roundTotalPoints.toFixed(2)} points
                                {' '}(after position multipliers)
                            </AlertDescription>
                        </Alert>
                    )}

                    {isRoundFinished && (
                        <Alert className="mb-4">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Viewing Mode:</strong> This round is finished. Lineup is locked and points have been calculated.
                                Select a future round to edit your lineup.
                            </AlertDescription>
                        </Alert>
                    )}

                    {isRoundLocked && currentActiveRound && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Round {currentActiveRound} in Progress!</strong> All lineup changes and player transactions are locked until the round finishes.
                            </AlertDescription>
                        </Alert>
                    )}

                    {!hasValidTeamComposition && !isRoundFinished && !isRoundLocked && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Invalid team composition. Need minimum: 3 Guards, 3 Forwards, 2 Centers
                            </AlertDescription>
                        </Alert>
                    )}

                    {validationErrors.length > 0 && !isRoundFinished && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <ul className="list-disc list-inside">
                                    {validationErrors.map((error, idx) => (
                                        <li key={idx}>{error}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {isValidLineup && !isRoundFinished && !isRoundLocked && (
                        <Alert className="mb-4 border-green-500 text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                                Valid lineup! Ready to save.
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isRoundFinished && !isRoundLocked && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Step 1:</strong> Select your starting five formation below. <strong>Step 2:</strong> Drag players from the bench to the court positions.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Lineup Type Selector */}
            {!isRoundFinished && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Step 1: Select Formation</CardTitle>
                        <CardDescription>Choose your starting five combination (Guards-Forwards-Centers)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <select
                            value={lineupType || ''}
                            onChange={(e) => handleLineupTypeChange(e.target.value)}
                            className="flex h-9 w-full max-w-md items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Select a formation...</option>
                            {Object.entries(LINEUP_CONFIGS).map(([key, config]) => (
                                <option key={key} value={key}>
                                    {key} - {config.label}
                                </option>
                            ))}
                        </select>

                        <Alert className="mt-4">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Point Multipliers:</strong> Starters earn <span className="font-bold text-green-600">100%</span> of fantasy points,
                                Sixth Man earns <span className="font-bold text-yellow-600">75%</span>,
                                and Bench players earn <span className="font-bold text-blue-600">50%</span>.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            )}

            {(lineupType || isRoundFinished) && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                    {/* Basketball Court */}
                    <Card className="lg:col-span-8">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                Step 2: Set Your Starting Five
                                <Badge className="bg-green-600 text-white">100%</Badge>
                            </CardTitle>
                            <CardDescription>Drag players from the sidebar to the court - Starters earn full fantasy points</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="relative rounded-lg overflow-hidden border-4 shadow-2xl dark:border-gray-800 border-gray-300"
                                style={{
                                    backgroundImage: 'url(/images/basketball-court-light.png)',
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center',
                                    backgroundColor: '#f8f9fa',
                                    paddingBottom: '75%',
                                    position: 'relative'
                                }}
                            >
                                <div className="absolute inset-0 dark:bg-[url('/images/basketball-court.png')] bg-[url('/images/basketball-court-light.png')]"
                                    style={{
                                        backgroundSize: 'contain',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center'
                                    }}
                                ></div>
                                <div className="absolute inset-0 dark:bg-black/20 bg-white/10"></div>

                                <div className="absolute inset-0 z-10">
                                    {[0, 1, 2, 3, 4].map((slotIndex) => {
                                        const config = lineupType ? LINEUP_CONFIGS[lineupType] : LINEUP_CONFIGS['2-2-1'];
                                        const slotPosition = getSlotPosition(slotIndex, config);
                                        const player = starters[slotIndex];
                                        const position = getCourtPosition(slotIndex, config);

                                        return (
                                            <div
                                                key={slotIndex}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={() => handleDropOnSlot(slotIndex)}
                                                className={`
                                                    absolute flex flex-col items-center justify-center
                                                    w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-36 lg:w-32 lg:h-40
                                                    rounded-lg sm:rounded-xl border-2 transition-all
                                                    ${player ? 'bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 from-white to-gray-50 dark:border-white/60 border-gray-400' : 'dark:bg-black/40 bg-white/50 border-dashed dark:border-white/30 border-gray-400/50'}
                                                    ${draggedPlayer && draggedPlayer.player.position === slotPosition ? 'ring-2 sm:ring-4 ring-green-500/70 scale-105' : ''}
                                                `}
                                                style={{
                                                    left: position.left,
                                                    top: position.top,
                                                    transform: 'translate(-50%, -50%)'
                                                }}
                                            >
                                                {player ? (
                                                    <div
                                                        draggable
                                                        onDragStart={() => handleDragStart(player)}
                                                        onDragEnd={handleDragEnd}
                                                        className="flex flex-col items-center gap-0.5 sm:gap-1 cursor-move w-full p-1 sm:p-2"
                                                    >
                                                        <div className={`absolute -top-1 sm:-top-2 left-1/2 -translate-x-1/2 ${getPositionColor(player.player.position)} text-white px-1 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold`}>
                                                            {player.player.position}
                                                        </div>

                                                        {(player.player.photo_headshot_url || player.player.photo_url) ? (
                                                            <img
                                                                src={(player.player.photo_headshot_url || player.player.photo_url)!}
                                                                alt={player.player.name}
                                                                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full object-cover object-top border-2 border-white/80"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gray-700 flex items-center justify-center border-2 border-white/80">
                                                                <User className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-gray-300" />
                                                            </div>
                                                        )}
                                                        <div className="text-center w-full">
                                                            <div className="font-bold dark:text-white text-gray-900 text-[10px] sm:text-xs truncate">{player.player.name}</div>
                                                            <div className="text-[8px] sm:text-[10px] dark:text-gray-300 text-gray-600 truncate hidden sm:block">{player.player.team.name}</div>
                                                            {isRoundFinished ? (
                                                                <div className="text-[10px] sm:text-xs mt-1">
                                                                    <div className="font-bold text-green-400">
                                                                        {player.round_team_points?.toFixed(2)} pts
                                                                    </div>
                                                                    <div className="text-[8px] text-gray-400">
                                                                        {player.round_fantasy_points?.toFixed(1)} FP × {((player.multiplier || 0.5) * 100).toFixed(0)}%
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-[10px] sm:text-xs font-bold text-blue-400 mt-1">
                                                                    {player.points_earned.toFixed(1)} pts
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center dark:text-white/50 text-gray-500 text-[10px] sm:text-xs p-1 sm:p-2">
                                                        <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 opacity-50" />
                                                        <span className="font-medium text-[9px] sm:text-xs">{slotPosition}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mobile-only: Available Players Horizontal Scroll */}
                    <Card className="lg:hidden">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                Available Players
                                <Badge className="bg-blue-600 text-white text-xs">50%</Badge>
                            </CardTitle>
                            <CardDescription className="text-xs">Drag players to positions above</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                                {bench.map((player) => (
                                    <div
                                        key={player.player.id}
                                        draggable
                                        onDragStart={() => handleDragStart(player)}
                                        onDragEnd={handleDragEnd}
                                        className="flex-shrink-0 w-28 p-2 border-2 rounded-lg bg-gradient-to-br dark:from-blue-900/20 dark:to-indigo-900/20 from-blue-50 to-indigo-50 border-blue-300 cursor-move"
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            {(player.player.photo_headshot_url || player.player.photo_url) ? (
                                                <img
                                                    src={(player.player.photo_headshot_url || player.player.photo_url)!}
                                                    alt={player.player.name}
                                                    className="w-14 h-14 rounded-full object-cover object-top border-2 border-blue-300"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center border-2 border-blue-300">
                                                    <User className="h-6 w-6 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="text-center w-full">
                                                <div className="font-medium text-xs truncate">{player.player.name}</div>
                                                <Badge className="text-[10px] mt-1">{player.player.position}</Badge>
                                                {isRoundFinished ? (
                                                    <div className="text-[10px] mt-1">
                                                        <div className="font-bold text-green-600">
                                                            {player.round_team_points?.toFixed(1)} pts
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] font-bold text-blue-600 mt-1">
                                                        {player.points_earned.toFixed(1)} pts
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {bench.length === 0 && (
                                    <div className="w-full text-center text-sm text-muted-foreground py-4">
                                        No bench players
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mobile-only: Sixth Man */}
                    <Card className="lg:hidden">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-yellow-500" />
                                Sixth Man
                                <Badge className="bg-yellow-600 text-white text-xs">75%</Badge>
                            </CardTitle>
                            <CardDescription className="text-xs">Key substitute - earns 75% of fantasy points</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDropOnSixthMan}
                                className={`
                                    relative flex flex-col items-center p-3 rounded-lg border-2 border-dashed
                                    min-h-[120px] transition-all
                                    ${sixthMan ? 'bg-gradient-to-br dark:from-yellow-900/20 dark:to-amber-900/20 from-yellow-50 to-amber-50 border-yellow-400' : 'dark:bg-gray-800/50 bg-white/50 dark:border-gray-600 border-gray-300'}
                                    ${draggedPlayer ? 'ring-4 ring-yellow-500/30' : ''}
                                `}
                            >
                                {sixthMan ? (
                                    <div
                                        draggable
                                        onDragStart={() => handleDragStart(sixthMan)}
                                        onDragEnd={handleDragEnd}
                                        className="flex flex-col items-center gap-1 cursor-move w-full"
                                    >
                                        {(sixthMan.player.photo_headshot_url || sixthMan.player.photo_url) ? (
                                            <img
                                                src={(sixthMan.player.photo_headshot_url || sixthMan.player.photo_url)!}
                                                alt={sixthMan.player.name}
                                                className="w-14 h-14 rounded-full object-cover object-top border-2 border-yellow-400"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center border-2 border-yellow-400">
                                                <User className="h-6 w-6 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="text-center w-full">
                                            <div className="font-medium text-xs truncate">{sixthMan.player.name}</div>
                                            <Badge className="text-[10px] mt-1">{sixthMan.player.position}</Badge>
                                            {isRoundFinished ? (
                                                <div className="text-[10px] mt-1">
                                                    <div className="font-bold text-green-600">
                                                        {sixthMan.round_team_points?.toFixed(1)} pts
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] font-bold text-blue-600 mt-1">
                                                    {sixthMan.points_earned.toFixed(1)} pts
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setBench([...bench, sixthMan]);
                                                setSixthMan(null);
                                            }}
                                            className="mt-1 text-xs h-6"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground text-xs h-full flex flex-col items-center justify-center">
                                        <Sparkles className="h-6 w-6 mb-1 opacity-50" />
                                        <span>Drag player here</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Desktop: Sixth Man + Available Players */}
                    <div className="hidden lg:block lg:col-span-4 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-yellow-500" />
                                    Sixth Man
                                    <Badge className="bg-yellow-600 text-white">75%</Badge>
                                </CardTitle>
                                <CardDescription>Key substitute - earns 75% of fantasy points</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDropOnSixthMan}
                                    className={`
                                        relative flex flex-col items-center p-4 rounded-lg border-2 border-dashed
                                        min-h-[140px] transition-all
                                        ${sixthMan ? 'bg-gradient-to-br dark:from-yellow-900/20 dark:to-amber-900/20 from-yellow-50 to-amber-50 border-yellow-400' : 'dark:bg-gray-800/50 bg-white/50 dark:border-gray-600 border-gray-300'}
                                        ${draggedPlayer ? 'ring-4 ring-yellow-500/30' : ''}
                                    `}
                                >
                                    {sixthMan ? (
                                        <div
                                            draggable
                                            onDragStart={() => handleDragStart(sixthMan)}
                                            onDragEnd={handleDragEnd}
                                            className="flex flex-col items-center gap-2 cursor-move w-full p-2"
                                        >
                                            {(sixthMan.player.photo_headshot_url || sixthMan.player.photo_url) ? (
                                                <img
                                                    src={(sixthMan.player.photo_headshot_url || sixthMan.player.photo_url)!}
                                                    alt={sixthMan.player.name}
                                                    className="w-16 h-16 rounded-full object-cover object-top border-2 border-yellow-400"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-yellow-400">
                                                    <User className="h-8 w-8 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="text-center w-full">
                                                <div className="font-medium text-sm truncate">{sixthMan.player.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">{sixthMan.player.team.name}</div>
                                                <div className="flex items-center justify-center gap-2 mt-1">
                                                    <Badge className="text-xs">{sixthMan.player.position}</Badge>
                                                    <Badge className="bg-yellow-500 text-white text-xs">6th Man</Badge>
                                                </div>
                                                {isRoundFinished ? (
                                                    <div className="text-xs mt-1">
                                                        <div className="font-bold text-green-600">
                                                            {sixthMan.round_team_points?.toFixed(2)} pts
                                                        </div>
                                                        <div className="text-[10px] text-gray-600">
                                                            {sixthMan.round_fantasy_points?.toFixed(1)} FP × {((sixthMan.multiplier || 0.75) * 100).toFixed(0)}%
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs font-bold text-blue-600 mt-1">
                                                        {sixthMan.points_earned.toFixed(1)} pts
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setBench([...bench, sixthMan]);
                                                    setSixthMan(null);
                                                }}
                                                className="mt-1 text-xs h-7"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground text-sm h-full flex flex-col items-center justify-center">
                                            <Sparkles className="h-8 w-8 mb-2 opacity-50" />
                                            <span>Drag player here</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    Available Players
                                    <Badge className="bg-blue-600 text-white">50%</Badge>
                                </CardTitle>
                                <CardDescription>Bench players earn 50% of fantasy points</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDropOnBench}
                                    className="space-y-3 max-h-[600px] overflow-y-auto"
                                >
                                    {bench.length === 0 ? (
                                        <div className="text-center text-muted-foreground text-sm py-8">
                                            All players assigned
                                        </div>
                                    ) : (
                                        bench.map((teamPlayer) => (
                                            <div
                                                key={teamPlayer.id}
                                                draggable
                                                onDragStart={() => handleDragStart(teamPlayer)}
                                                onDragEnd={handleDragEnd}
                                                className="flex items-center gap-3 p-3 border rounded-lg cursor-move hover:bg-muted/50 transition-all dark:bg-gray-800/50 bg-white dark:border-gray-700"
                                            >
                                                {(teamPlayer.player.photo_headshot_url || teamPlayer.player.photo_url) ? (
                                                    <img
                                                        src={(teamPlayer.player.photo_headshot_url || teamPlayer.player.photo_url)!}
                                                        alt={teamPlayer.player.name}
                                                        className="w-12 h-12 rounded-full object-cover object-top flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                        <User className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">{teamPlayer.player.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{teamPlayer.player.team.name}</div>
                                                    <Badge className={`${getPositionColor(teamPlayer.player.position)} text-white text-xs mt-1`}>
                                                        {teamPlayer.player.position}
                                                    </Badge>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    {isRoundFinished ? (
                                                        <>
                                                            <div className="text-xs font-bold text-green-600">
                                                                {teamPlayer.round_team_points?.toFixed(2)} pts
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                {teamPlayer.round_fantasy_points?.toFixed(1)} FP × {((teamPlayer.multiplier || 0.5) * 100).toFixed(0)}%
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-xs font-bold text-muted-foreground">
                                                            {teamPlayer.points_earned.toFixed(1)} pts
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </>
    );
}
