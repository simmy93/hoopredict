import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PlayerStatsModal from '@/components/PlayerStatsModal';
import { Trophy, User, Sparkles, AlertCircle, CheckCircle2, Info, Users, Star } from 'lucide-react';
import axios from 'axios';

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
    is_captain: boolean;
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
    upcomingGames?: any[];
    nextGameTime?: string | null;
    isLineupLocked?: boolean;
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
    upcomingGames = [],
    nextGameTime = null,
    isLineupLocked = false,
}: Props) {
    const [lineupType, setLineupType] = useState<LineupType | null>(
        (userTeam.lineup_type as LineupType) || null
    );
    const [starters, setStarters] = useState<(FantasyTeamPlayer | null)[]>([null, null, null, null, null]);
    const [sixthMan, setSixthMan] = useState<FantasyTeamPlayer | null>(null);
    const [bench, setBench] = useState<FantasyTeamPlayer[]>(initialTeamPlayers);
    const [captain, setCaptain] = useState<FantasyTeamPlayer | null>(null);
    const [draggedPlayer, setDraggedPlayer] = useState<FantasyTeamPlayer | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Player stats modal state
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [selectedPlayerStats, setSelectedPlayerStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Countdown timer state
    const [timeUntilLock, setTimeUntilLock] = useState<string | null>(null);

    // Initialize lineup from database
    useEffect(() => {
        const startersFromDb = initialTeamPlayers
            .filter(p => p.lineup_position && p.lineup_position >= 1 && p.lineup_position <= 5)
            .sort((a, b) => (a.lineup_position || 0) - (b.lineup_position || 0));

        const sixthManFromDb = initialTeamPlayers
            .find(p => p.lineup_position === 6);

        const benchFromDb = initialTeamPlayers
            .filter(p => !p.lineup_position || p.lineup_position > 6);

        const captainFromDb = initialTeamPlayers.find(p => p.is_captain);

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
        setCaptain(captainFromDb || null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRound]);

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

    // Countdown timer for lineup lock
    useEffect(() => {
        if (!nextGameTime || isRoundFinished || isLineupLocked) {
            setTimeUntilLock(null);
            return;
        }

        const updateCountdown = () => {
            const now = new Date().getTime();
            const lockTime = new Date(nextGameTime).getTime() - (5 * 60 * 1000); // 5 min before game
            const distance = lockTime - now;

            if (distance < 0) {
                setTimeUntilLock(null);
                // Refresh the page to get updated lock status
                router.reload({ only: ['isLineupLocked', 'upcomingGames', 'nextGameTime'] });
                return;
            }

            const hours = Math.floor(distance / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (hours > 0) {
                setTimeUntilLock(`${hours}h ${minutes}m`);
            } else if (minutes > 0) {
                setTimeUntilLock(`${minutes}m ${seconds}s`);
            } else {
                setTimeUntilLock(`${seconds}s`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [nextGameTime, isRoundFinished, isLineupLocked]);

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

        // Validate if player can be moved to this position (starter = position 1-5)
        const newPosition = slotIndex + 1; // Convert to position number
        const validation = canMovePlayer(draggedPlayer, newPosition, false);
        if (!validation.valid) {
            alert(validation.error);
            setDraggedPlayer(null);
            return;
        }

        const newStarters = [...starters];
        const oldSlotIndex = newStarters.findIndex(s => s?.id === draggedPlayer.id);
        if (oldSlotIndex !== -1) {
            newStarters[oldSlotIndex] = null;
        }

        let newBench = bench.filter(p => p.id !== draggedPlayer.id);

        // If there's already a player in this slot, move them to bench
        const existingPlayer = newStarters[slotIndex];
        if (existingPlayer && existingPlayer.id !== draggedPlayer.id) {
            newBench = [...newBench, existingPlayer];
            // If the displaced player was captain, remove captain status
            if (captain?.id === existingPlayer.id) {
                setCaptain(null);
            }
        }

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

        // Validate if player can be moved to bench (position = null, no captain)
        const validation = canMovePlayer(draggedPlayer, null, false);
        if (!validation.valid) {
            alert(validation.error);
            setDraggedPlayer(null);
            return;
        }

        const newStarters = [...starters];
        const slotIndex = newStarters.findIndex(s => s?.id === draggedPlayer.id);
        if (slotIndex !== -1) {
            newStarters[slotIndex] = null;
            setStarters(newStarters);
        }

        if (sixthMan?.id === draggedPlayer.id) {
            setSixthMan(null);
        }

        // If the dragged player was captain, remove captain status
        if (captain?.id === draggedPlayer.id) {
            setCaptain(null);
        }

        if (!bench.find(p => p.id === draggedPlayer.id)) {
            setBench([...bench, draggedPlayer]);
        }

        setDraggedPlayer(null);
    };

    const handleDropOnSixthMan = (e: React.DragEvent) => {
        e.stopPropagation(); // Prevent event from bubbling to bench drop zone
        if (!draggedPlayer || isRoundLocked || isRoundFinished) return;

        // Validate if player can be moved to sixth man (position = 6, no captain)
        const validation = canMovePlayer(draggedPlayer, 6, false);
        if (!validation.valid) {
            alert(validation.error);
            setDraggedPlayer(null);
            return;
        }

        // Remove from starters if applicable
        const newStarters = [...starters];
        const slotIndex = newStarters.findIndex(s => s?.id === draggedPlayer.id);
        if (slotIndex !== -1) {
            newStarters[slotIndex] = null;
        }

        // Build new bench: remove dragged player, add old sixth man if exists
        let newBench = bench.filter(p => p.id !== draggedPlayer.id);

        if (sixthMan) {
            newBench = [...newBench, sixthMan];
            // If the old sixth man was captain, remove captain status
            if (captain?.id === sixthMan.id) {
                setCaptain(null);
            }
        }

        // If the dragged player was captain, remove captain status
        if (captain?.id === draggedPlayer.id) {
            setCaptain(null);
        }

        // Update all states together
        setStarters(newStarters);
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

    // Helper function to check if a player has already played in the current round
    const hasPlayerPlayed = (player: FantasyTeamPlayer): boolean => {
        // If player has round_fantasy_points > 0, they've played
        return (player.round_fantasy_points ?? 0) > 0;
    };

    // Get numeric value for a position
    // Captain (4) > Starter (3) > Sixth Man (2) > Bench (1)
    const getPositionValue = (position: number | null, isCaptain: boolean): number => {
        if (isCaptain) return 4; // Captain
        if (position && position >= 1 && position <= 5) return 3; // Starter
        if (position === 6) return 2; // Sixth man
        return 1; // Bench (null or > 6)
    };

    // Check if a position change represents moving UP in value
    const isMovingUp = (
        oldPosition: number | null,
        newPosition: number | null,
        wasCaptain: boolean,
        isNewCaptain: boolean
    ): boolean => {
        const oldValue = getPositionValue(oldPosition, wasCaptain);
        const newValue = getPositionValue(newPosition, isNewCaptain);
        return newValue > oldValue;
    };

    // Validate if a player can be moved to a new position
    const canMovePlayer = (
        player: FantasyTeamPlayer,
        newPosition: number | null,
        isNewCaptain: boolean
    ): { valid: boolean; error?: string } => {
        // If player hasn't played, they can move anywhere
        if (!hasPlayerPlayed(player)) {
            return { valid: true };
        }

        // Get current position
        const currentPosition = player.lineup_position;
        const wasCaptain = captain?.id === player.id;

        // Check if moving up in value
        if (isMovingUp(currentPosition, newPosition, wasCaptain, isNewCaptain)) {
            return {
                valid: false,
                error: `Cannot move ${player.player.name} to a more valuable position after they've already played.`
            };
        }

        return { valid: true };
    };

    // Show player stats modal
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

    const handleCaptainToggle = (player: FantasyTeamPlayer) => {
        if (isRoundLocked || isRoundFinished) return;

        // Captain can only be selected from starters (positions 1-5)
        const isInStartingLineup = starters.some(s => s?.id === player.id);
        if (!isInStartingLineup) return;

        // Toggle captain - if already captain, remove; otherwise set as captain
        if (captain?.id === player.id) {
            setCaptain(null);
        } else {
            // Validate if player can be made captain (they're becoming captain)
            const validation = canMovePlayer(player, player.lineup_position, true);
            if (!validation.valid) {
                alert(validation.error);
                return;
            }
            setCaptain(player);
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
            sixth_man: sixthMan?.player.id || null,
            captain_id: captain?.player.id || null
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

                    {/* Countdown timer for lineup lock */}
                    {timeUntilLock && !isRoundFinished && !isRoundLocked && (
                        <Alert className="mb-4 border-amber-500 bg-amber-50">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800">
                                <strong>Lineup locks in {timeUntilLock}</strong> - Save your changes before the next game starts!
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Upcoming games */}
                    {upcomingGames && upcomingGames.length > 0 && !isRoundFinished && !isRoundLocked && (
                        <Alert className="mb-4">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Upcoming Games:</strong>
                                <ul className="mt-2 space-y-1 text-sm">
                                    {upcomingGames.slice(0, 3).map((game: any) => (
                                        <li key={game.id}>
                                            {game.home_team?.name} vs {game.away_team?.name} - {new Date(game.scheduled_at).toLocaleString()}
                                        </li>
                                    ))}
                                    {upcomingGames.length > 3 && (
                                        <li className="text-gray-500">+{upcomingGames.length - 3} more games</li>
                                    )}
                                </ul>
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
                <div className="mt-6">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold dark:text-white text-gray-900">Step 1: Select Formation</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Choose your starting five combination (Guards-Forwards-Centers)</p>
                    </div>
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
                            <strong>Point Multipliers:</strong> Captain (must be a starter) earns <span className="font-bold text-purple-600">200%</span> of fantasy points,
                            Starters earn <span className="font-bold text-green-600">100%</span>,
                            Sixth Man earns <span className="font-bold text-yellow-600">75%</span>,
                            and Bench players earn <span className="font-bold text-blue-600">50%</span>. Click the star on a starter to make them captain!
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {(lineupType || isRoundFinished) && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                    {/* Basketball Court */}
                    <div className="lg:col-span-8">
                        {/* Header */}
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold dark:text-white text-gray-900 flex items-center gap-2">
                                Step 2: Set Your Starting Five
                                <span className="bg-green-600 text-white px-2 py-0.5 rounded text-sm font-normal">
                                    100%
                                </span>
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Drag players from the sidebar to the court – Starters earn full fantasy points
                            </p>
                        </div>

                        {/* Court */}
                        <div
                            className="relative rounded-lg overflow-hidden border-4 shadow-2xl dark:border-gray-800 border-gray-300 pt-10"
                            style={{
                                backgroundImage: 'url(/images/basketball-court-light.png)',
                                backgroundColor: '#1f2937',
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
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
                                                w-16 h-24 sm:w-28 sm:h-36 md:w-28 md:h-36 lg:w-32 lg:h-40
                                                rounded-lg border-2 transition-all
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
                                                    className="flex flex-col items-center gap-1 cursor-move w-full p-1 sm:p-4 relative"
                                                >
                                                    <div className={`absolute -top-2 left-1/2 -translate-x-1/2 ${getPositionColor(player.player.position)} text-white px-1 sm:px-2 py-0 rounded text-[10px] sm:text-xs font-bold`}>
                                                        {player.player.position}
                                                    </div>

                                                    {/* Played indicator */}
                                                    {hasPlayerPlayed(player) && (
                                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white px-1 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold whitespace-nowrap z-20">
                                                            ✓ {(player.round_fantasy_points ?? 0).toFixed(1)} FP
                                                        </div>
                                                    )}

                                                    {/* Captain Star - clickable */}
                                                    {!isRoundFinished && !isRoundLocked && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCaptainToggle(player);
                                                            }}
                                                            className="absolute -top-2 -right-2 z-10 cursor-pointer hover:scale-110 transition-transform"
                                                            title={captain?.id === player.id ? "Remove Captain" : "Make Captain"}
                                                        >
                                                            <Star
                                                                className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                                                    captain?.id === player.id
                                                                        ? 'fill-purple-500 text-purple-500'
                                                                        : 'fill-gray-300 text-gray-400 hover:fill-purple-300 hover:text-purple-400'
                                                                }`}
                                                            />
                                                        </button>
                                                    )}

                                                    {/* Captain indicator for finished/locked rounds */}
                                                    {(isRoundFinished || isRoundLocked) && player.is_captain && (
                                                        <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 z-10">
                                                            <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-purple-500 text-purple-500" />
                                                        </div>
                                                    )}

                                                    {(player.player.photo_headshot_url || player.player.photo_url) ? (
                                                        <img
                                                            src={(player.player.photo_headshot_url || player.player.photo_url)!}
                                                            alt={player.player.name}
                                                            className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full object-cover object-top border-2 border-white/80"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gray-700 flex items-center justify-center border-2 border-white/80">
                                                            <User className="h-4 w-4 sm:h-6 sm:w-6 md:h-7 md:w-7 text-gray-300" />
                                                        </div>
                                                    )}
                                                    <div className="text-center w-full">
                                                        <div
                                                            className="font-bold dark:text-white text-gray-900 text-[9px] sm:text-xs truncate hover:text-primary cursor-pointer transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                showPlayerStats(player.player.id);
                                                            }}
                                                        >
                                                            {player.player.name}
                                                        </div>
                                                        <div className="text-[8px] sm:text-[10px] dark:text-gray-300 text-gray-600 truncate hidden sm:block">{player.player.team.name}</div>
                                                        {isRoundFinished ? (
                                                            <div className="text-[9px] sm:text-xs mt-0.5">
                                                                <div className={`font-bold ${player.is_captain ? 'text-purple-400' : 'text-green-400'}`}>
                                                                    {player.round_team_points?.toFixed(2)} pts
                                                                </div>
                                                                <div className="text-[7px] sm:text-[8px] text-gray-400">
                                                                    {player.round_fantasy_points?.toFixed(1)} FP × {((player.multiplier || 0.5) * 100).toFixed(0)}%
                                                                    {player.is_captain && ' (C)'}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-[9px] sm:text-xs font-bold text-blue-400 mt-0.5">
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
                    </div>


                    {/* Mobile-only: Bench & Substitutes Horizontal Scroll */}
                    <Card className="lg:hidden">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                Bench & Substitutes
                            </CardTitle>
                            <CardDescription className="text-xs">6th man: 75%, Bench: 50% points</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                                {/* Sixth Man Card */}
                                {sixthMan ? (
                                    <div
                                        key={`sixth-${sixthMan.player.id}`}
                                        draggable
                                        onDragStart={() => handleDragStart(sixthMan)}
                                        onDragEnd={handleDragEnd}
                                        className="flex-shrink-0 w-28 p-2 border-2 rounded-lg bg-gradient-to-br dark:from-yellow-900/20 dark:to-amber-900/20 from-yellow-50 to-amber-50 border-yellow-400 cursor-move"
                                    >
                                        <div className="flex flex-col items-center gap-1">
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
                                                <div
                                                    className="font-medium text-xs truncate hover:text-primary cursor-pointer transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        showPlayerStats(sixthMan.player.id);
                                                    }}
                                                >
                                                    {sixthMan.player.name}
                                                </div>
                                                <Badge className="bg-yellow-500 text-white text-[10px] mt-1 flex items-center gap-1 justify-center">
                                                    <Sparkles className="h-2 w-2" />
                                                    6th
                                                </Badge>
                                                {isRoundFinished ? (
                                                    <div className="text-[10px] mt-1">
                                                        <div className="font-bold text-yellow-600">
                                                            {sixthMan.round_team_points?.toFixed(1)} pts
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] font-bold text-yellow-600 mt-1">
                                                        {sixthMan.points_earned.toFixed(1)} pts
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={handleDropOnSixthMan}
                                        className="flex-shrink-0 w-28 p-2 border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600 cursor-pointer"
                                    >
                                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                            <Sparkles className="h-8 w-8 opacity-50 mb-1" />
                                            <span className="text-[10px]">6th Man</span>
                                        </div>
                                    </div>
                                )}

                                {/* Regular Bench Players */}
                                {bench.filter(p => p.id !== sixthMan?.id).map((player) => (
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
                                                <div
                                                    className="font-medium text-xs truncate hover:text-primary cursor-pointer transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        showPlayerStats(player.player.id);
                                                    }}
                                                >
                                                    {player.player.name}
                                                </div>
                                                <Badge className="text-[10px] mt-1">{player.player.position}</Badge>
                                                {isRoundFinished ? (
                                                    <div className="text-[10px] mt-1">
                                                        <div className="font-bold text-blue-600">
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
                                {bench.length === 0 && !sixthMan && (
                                    <div className="w-full text-center text-sm text-muted-foreground py-4">
                                        No bench players
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mobile-only: Captain */}
                    <Card className="lg:hidden">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Star className="h-4 w-4 text-purple-500" />
                                Team Captain
                                <Badge className="bg-purple-600 text-white text-xs">200%</Badge>
                            </CardTitle>
                            <CardDescription className="text-xs">Choose a starter as captain - earns 200% points</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`
                                    relative flex flex-col items-center p-3 rounded-lg border-2
                                    min-h-[120px] transition-all
                                    ${captain ? 'bg-gradient-to-br dark:from-purple-900/20 dark:to-indigo-900/20 from-purple-50 to-indigo-50 border-purple-400' : 'dark:bg-gray-800/50 bg-white/50 dark:border-gray-600 border-gray-300 border-dashed'}
                                `}
                            >
                                {captain ? (
                                    <div className="flex flex-col items-center gap-1 w-full">
                                        <div className="relative">
                                            {(captain.player.photo_headshot_url || captain.player.photo_url) ? (
                                                <img
                                                    src={(captain.player.photo_headshot_url || captain.player.photo_url)!}
                                                    alt={captain.player.name}
                                                    className="w-16 h-16 rounded-full object-cover object-top border-2 border-purple-400"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-purple-400">
                                                    <User className="h-8 w-8 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="absolute -top-1 -right-1">
                                                <Star className="h-6 w-6 fill-purple-500 text-purple-500" />
                                            </div>
                                        </div>
                                        <div className="text-center w-full">
                                            <div className="font-bold text-xs truncate">{captain.player.name}</div>
                                            <Badge className="bg-purple-500 text-white text-[10px] mt-1">Captain</Badge>
                                            {isRoundFinished ? (
                                                <div className="text-[10px] mt-1">
                                                    <div className="font-bold text-purple-600">
                                                        {captain.round_team_points?.toFixed(1)} pts
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] font-bold text-purple-600 mt-1">
                                                    {captain.points_earned.toFixed(1)} pts
                                                </div>
                                            )}
                                        </div>
                                        {!isRoundFinished && !isRoundLocked && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setCaptain(null)}
                                                className="mt-1 text-xs h-6"
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground text-xs h-full flex flex-col items-center justify-center">
                                        <Star className="h-6 w-6 mb-1 opacity-50" />
                                        <span>Click star on a starter</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Desktop: Captain + Available Players */}
                    <div className="hidden lg:block lg:col-span-4 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Star className="h-5 w-5 text-purple-500" />
                                    Team Captain
                                    <Badge className="bg-purple-600 text-white">200%</Badge>
                                </CardTitle>
                                <CardDescription>Choose a starter as captain - earns 200% of fantasy points</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`
                                        relative flex flex-col items-center p-4 rounded-lg border-2
                                        min-h-[140px] transition-all
                                        ${captain ? 'bg-gradient-to-br dark:from-purple-900/20 dark:to-indigo-900/20 from-purple-50 to-indigo-50 border-purple-400' : 'dark:bg-gray-800/50 bg-white/50 dark:border-gray-600 border-gray-300 border-dashed'}
                                    `}
                                >
                                    {captain ? (
                                        <div className="flex flex-col items-center gap-2 w-full p-2">
                                            <div className="relative">
                                                {(captain.player.photo_headshot_url || captain.player.photo_url) ? (
                                                    <img
                                                        src={(captain.player.photo_headshot_url || captain.player.photo_url)!}
                                                        alt={captain.player.name}
                                                        className="w-20 h-20 rounded-full object-cover object-top border-4 border-purple-400"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-purple-400">
                                                        <User className="h-10 w-10 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="absolute -top-2 -right-2">
                                                    <Star className="h-8 w-8 fill-purple-500 text-purple-500 drop-shadow-lg" />
                                                </div>
                                            </div>
                                            <div className="text-center w-full">
                                                <div className="font-bold text-base truncate">{captain.player.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">{captain.player.team.name}</div>
                                                <div className="flex items-center justify-center gap-2 mt-1">
                                                    <Badge className="text-xs">{captain.player.position}</Badge>
                                                    <Badge className="bg-purple-500 text-white text-xs">Captain</Badge>
                                                </div>
                                                {isRoundFinished ? (
                                                    <div className="text-sm mt-2">
                                                        <div className="font-bold text-purple-600">
                                                            {captain.round_team_points?.toFixed(2)} pts
                                                        </div>
                                                        <div className="text-[10px] text-gray-600">
                                                            {captain.round_fantasy_points?.toFixed(1)} FP × 200%
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm font-bold text-purple-600 mt-2">
                                                        {captain.points_earned.toFixed(1)} pts
                                                    </div>
                                                )}
                                            </div>
                                            {!isRoundFinished && !isRoundLocked && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setCaptain(null)}
                                                    className="mt-1 text-xs h-7"
                                                >
                                                    Remove Captain
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground text-sm h-full flex flex-col items-center justify-center">
                                            <Star className="h-8 w-8 mb-2 opacity-50" />
                                            <span className="font-medium">No Captain Selected</span>
                                            <span className="text-xs mt-1">Click star on a starter to make them captain</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    Bench & Substitutes
                                </CardTitle>
                                <CardDescription>Sixth man earns 75%, bench players earn 50% of fantasy points</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDropOnBench}
                                    className="space-y-3 max-h-[600px] overflow-y-auto"
                                >
                                    {/* Sixth Man Section */}
                                    <div
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={handleDropOnSixthMan}
                                        className={`
                                            p-3 border-2 rounded-lg transition-all
                                            ${sixthMan ? 'bg-gradient-to-br dark:from-yellow-900/20 dark:to-amber-900/20 from-yellow-50 to-amber-50 border-yellow-400' : 'border-dashed dark:border-gray-600 border-gray-300'}
                                            ${draggedPlayer ? 'ring-2 ring-yellow-500/50' : ''}
                                        `}
                                    >
                                        {sixthMan ? (
                                            <div
                                                draggable
                                                onDragStart={() => handleDragStart(sixthMan)}
                                                onDragEnd={handleDragEnd}
                                                className="flex items-center gap-3 cursor-move"
                                            >
                                                {(sixthMan.player.photo_headshot_url || sixthMan.player.photo_url) ? (
                                                    <img
                                                        src={(sixthMan.player.photo_headshot_url || sixthMan.player.photo_url)!}
                                                        alt={sixthMan.player.name}
                                                        className="w-12 h-12 rounded-full object-cover object-top flex-shrink-0 border-2 border-yellow-400"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border-2 border-yellow-400">
                                                        <User className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="font-medium text-sm truncate hover:text-primary cursor-pointer transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                showPlayerStats(sixthMan.player.id);
                                                            }}
                                                        >
                                                            {sixthMan.player.name}
                                                        </div>
                                                        <Badge className="bg-yellow-500 text-white text-xs flex items-center gap-1">
                                                            <Sparkles className="h-3 w-3" />
                                                            6th Man
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">{sixthMan.player.team.name}</div>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge className={`${getPositionColor(sixthMan.player.position)} text-white text-xs`}>
                                                            {sixthMan.player.position}
                                                        </Badge>
                                                        {hasPlayerPlayed(sixthMan) && !isRoundFinished && (
                                                            <Badge className="bg-green-500 text-white text-xs">
                                                                ✓ Played
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    {isRoundFinished ? (
                                                        <>
                                                            <div className="text-xs font-bold text-yellow-600">
                                                                {sixthMan.round_team_points?.toFixed(2)} pts
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                {sixthMan.round_fantasy_points?.toFixed(1)} FP × 75%
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-xs font-bold text-yellow-600">
                                                            {sixthMan.points_earned.toFixed(1)} pts
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center text-muted-foreground text-xs py-4">
                                                <Sparkles className="h-6 w-6 mx-auto mb-1 opacity-50" />
                                                <span>Drag a player here to make them sixth man (75% points)</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Regular Bench Players */}
                                    {bench.length === 0 && !sixthMan ? (
                                        <div className="text-center text-muted-foreground text-sm py-8">
                                            All players assigned
                                        </div>
                                    ) : (
                                        bench.filter(p => p.id !== sixthMan?.id).map((teamPlayer) => (
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
                                                    <div
                                                        className="font-medium text-sm truncate hover:text-primary cursor-pointer transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            showPlayerStats(teamPlayer.player.id);
                                                        }}
                                                    >
                                                        {teamPlayer.player.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">{teamPlayer.player.team.name}</div>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge className={`${getPositionColor(teamPlayer.player.position)} text-white text-xs`}>
                                                            {teamPlayer.player.position}
                                                        </Badge>
                                                        {hasPlayerPlayed(teamPlayer) && !isRoundFinished && (
                                                            <Badge className="bg-green-500 text-white text-xs">
                                                                ✓ Played
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    {isRoundFinished ? (
                                                        <>
                                                            <div className="text-xs font-bold text-blue-600">
                                                                {teamPlayer.round_team_points?.toFixed(2)} pts
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                {teamPlayer.round_fantasy_points?.toFixed(1)} FP × 50%
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

            {/* Player Stats Modal */}
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
        </>
    );
}
