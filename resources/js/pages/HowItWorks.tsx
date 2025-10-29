import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Head } from '@inertiajs/react';

export default function HowItWorks() {
    return (
        <AuthenticatedLayout>
            <Head title="How It Works" />
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        How It Works
                    </h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Learn about prediction scoring, fantasy leagues, player pricing, and more
                    </p>
                </div>

                <Tabs defaultValue="predictions" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto">
                        <TabsTrigger value="predictions" className="text-xs sm:text-sm">
                            🎯 Predictions
                        </TabsTrigger>
                        <TabsTrigger value="fantasy" className="text-xs sm:text-sm">
                            🏆 Fantasy
                        </TabsTrigger>
                        <TabsTrigger value="pricing" className="text-xs sm:text-sm">
                            💰 Pricing
                        </TabsTrigger>
                        <TabsTrigger value="points" className="text-xs sm:text-sm">
                            📊 Points
                        </TabsTrigger>
                        <TabsTrigger value="locking" className="text-xs sm:text-sm">
                            🔒 Locking
                        </TabsTrigger>
                        <TabsTrigger value="budgets" className="text-xs sm:text-sm">
                            💎 Budgets
                        </TabsTrigger>
                    </TabsList>

                    {/* Prediction Leagues Tab */}
                    <TabsContent value="predictions" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-2xl">🎯</span>
                                    Prediction Leagues
                                </CardTitle>
                                <CardDescription>
                                    Compete with friends by predicting EuroLeague game scores
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">How to Play</h3>
                                    <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400">
                                        <li>Join or create a prediction league</li>
                                        <li>Before each game starts, predict the final score</li>
                                        <li>Earn points based on prediction accuracy</li>
                                        <li>Climb the leaderboard and compete for the top spot</li>
                                    </ol>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Scoring System</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                            <span className="font-bold text-green-600 dark:text-green-400 text-xl">30 pts</span>
                                            <span className="text-slate-700 dark:text-slate-300">
                                                <strong>Exact Score</strong> - You nailed it! Both scores match perfectly
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                            <span className="font-bold text-blue-600 dark:text-blue-400 text-xl">15 pts</span>
                                            <span className="text-slate-700 dark:text-slate-300">
                                                <strong>Exact Difference</strong> - Correct winner with exact point margin
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                            <span className="font-bold text-purple-600 dark:text-purple-400 text-xl">10 pts</span>
                                            <span className="text-slate-700 dark:text-slate-300">
                                                <strong>Within 5 Points</strong> - Correct winner, margin off by 5 or less
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                            <span className="font-bold text-orange-600 dark:text-orange-400 text-xl">7 pts</span>
                                            <span className="text-slate-700 dark:text-slate-300">
                                                <strong>Within 10 Points</strong> - Correct winner, margin off by 6-10
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                                            <span className="font-bold text-yellow-600 dark:text-yellow-400 text-xl">4 pts</span>
                                            <span className="text-slate-700 dark:text-slate-300">
                                                <strong>Winner Only</strong> - You got the winner right
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        <strong>Example:</strong> If the actual score is 85-78 (7 point margin) and you predicted 82-75 (7 point margin), you earn 15 points for exact difference!
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Fantasy Leagues Tab */}
                    <TabsContent value="fantasy" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-2xl">🏆</span>
                                    Fantasy Leagues
                                </CardTitle>
                                <CardDescription>
                                    Build your dream team with real EuroLeague players
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Two Game Modes</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                                            <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Draft Mode</h4>
                                            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                                <li>• Snake draft with real-time picks</li>
                                                <li>• Auto-pick if time runs out</li>
                                                <li>• Your roster is locked after draft</li>
                                                <li>• Focus on lineup optimization</li>
                                            </ul>
                                        </div>
                                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                                            <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">Marketplace Mode</h4>
                                            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                                <li>• Buy/sell players anytime</li>
                                                <li>• Budget constraints (€10M - €25M)</li>
                                                <li>• Dynamic player pricing</li>
                                                <li>• Trade players between rounds</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Lineup Positions & Multipliers</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                        Your team has 10 players, but not all contribute equally to your score:
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                            <span className="font-bold text-green-600 dark:text-green-400">100%</span>
                                            <span className="text-slate-700 dark:text-slate-300">
                                                <strong>Starters (Positions 1-5)</strong> - Full fantasy points counted
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                                            <span className="font-bold text-yellow-600 dark:text-yellow-400">75%</span>
                                            <span className="text-slate-700 dark:text-slate-300">
                                                <strong>Sixth Man (Position 6)</strong> - 75% of fantasy points counted
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                            <span className="font-bold text-blue-600 dark:text-blue-400">50%</span>
                                            <span className="text-slate-700 dark:text-slate-300">
                                                <strong>Bench (Positions 7-10)</strong> - 50% of fantasy points counted
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Team Requirements</h3>
                                    <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                                        <li>• <strong>10 players total</strong> per team</li>
                                        <li>• Minimum <strong>3 Guards</strong>, <strong>3 Forwards</strong>, <strong>2 Centers</strong></li>
                                        <li>• 5 starters, 1 sixth man, 4 bench players</li>
                                        <li>• Change your lineup and formation before each round</li>
                                    </ul>
                                </div>

                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        <strong>Strategy Tip:</strong> Put your most consistent performers in starter positions for maximum points. Save bench spots for high-risk, high-reward players!
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Player Pricing Tab */}
                    <TabsContent value="pricing" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-2xl">💰</span>
                                    Player Pricing System
                                </CardTitle>
                                <CardDescription>
                                    How player prices change based on performance (Marketplace Mode)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Dynamic Pricing Formula</h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-3">
                                        Player prices adjust after each round using a weighted average system to prevent wild price swings:
                                    </p>
                                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg font-mono text-sm">
                                        New Price = (70% × Average of last 4 prices) + (30% × Current round performance)
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-2">How It Works</h3>
                                    <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                                        <li>
                                            <strong className="text-slate-900 dark:text-slate-100">Round 1:</strong> Initial price based purely on performance (FP × €100k)
                                        </li>
                                        <li>
                                            <strong className="text-slate-900 dark:text-slate-100">Rounds 2+:</strong> 70% based on historical average + 30% current round
                                        </li>
                                        <li>
                                            <strong className="text-slate-900 dark:text-slate-100">No play:</strong> If player doesn't play, price unchanged (skipped in calculations)
                                        </li>
                                        <li>
                                            <strong className="text-slate-900 dark:text-slate-100">Boundaries:</strong> Minimum €100k, Maximum €10M
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Example: Mike James Price History</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                                            <span className="text-sm">Round 1: 35.1 FP</span>
                                            <span className="font-semibold text-green-600 dark:text-green-400">€3.51M</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                                            <span className="text-sm">Round 2: 33.0 FP</span>
                                            <span className="font-semibold text-green-600 dark:text-green-400">€3.46M (-1.4%)</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                                            <span className="text-sm">Round 3: 28.5 FP</span>
                                            <span className="font-semibold text-orange-600 dark:text-orange-400">€3.34M (-3.5%)</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                        Notice how prices change gradually, not drastically. This rewards smart long-term investing!
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        <strong>Buy Low, Sell High:</strong> Look for players with recent bad games who are about to bounce back. Their price will be lower due to the weighted average!
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Fantasy Points Tab */}
                    <TabsContent value="points" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-2xl">📊</span>
                                    Fantasy Points Calculation
                                </CardTitle>
                                <CardDescription>
                                    How player game statistics convert to fantasy points
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Stat Values</h3>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="p-3 border border-green-200 dark:border-green-800 rounded-lg">
                                            <span className="text-green-600 dark:text-green-400 font-semibold">Positive Actions</span>
                                            <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                                <li>• Points scored: +1 per point</li>
                                                <li>• Assists: +1.5 each</li>
                                                <li>• Rebounds: +1.2 each</li>
                                                <li>• Steals/Blocks: +2 each</li>
                                                <li>• Field goals made: +0.5</li>
                                            </ul>
                                        </div>
                                        <div className="p-3 border border-red-200 dark:border-red-800 rounded-lg">
                                            <span className="text-red-600 dark:text-red-400 font-semibold">Negative Actions</span>
                                            <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                                <li>• Turnovers: -1.5 each</li>
                                                <li>• Missed shots: -0.5 each</li>
                                                <li>• Personal fouls: -0.5 each</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        <strong>Example:</strong> A player with 25 points, 8 assists, 5 rebounds, 2 steals, but 3 turnovers would earn approximately 45 fantasy points (25 + 12 + 6 + 4 - 4.5).
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Round Locking Tab */}
                    <TabsContent value="locking" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-2xl">🔒</span>
                                    Round Locking System
                                </CardTitle>
                                <CardDescription>
                                    When you can and cannot make changes to your team
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Active Round Lock</h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-3">
                                        Rounds lock when the first game is scheduled to start. During an active round:
                                    </p>
                                    <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                                        <li>❌ <strong>Cannot</strong> change your lineup</li>
                                        <li>❌ <strong>Cannot</strong> change formation</li>
                                        <li>❌ <strong>Cannot</strong> buy or sell players (Marketplace mode)</li>
                                        <li>✅ <strong>Can</strong> view live scores and player stats</li>
                                    </ul>
                                </div>

                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <p className="text-sm text-amber-900 dark:text-amber-200">
                                        <strong>⚠️ Important:</strong> Set your lineup before the round starts! Once the first game begins, all changes are locked to prevent unfair advantages.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-2">After Round Completes</h3>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        Once all games finish, the round unlocks and:
                                    </p>
                                    <ul className="space-y-1 text-slate-600 dark:text-slate-400 mt-2">
                                        <li>✅ Your team points are calculated</li>
                                        <li>✅ Player prices update (Marketplace mode)</li>
                                        <li>✅ You can prepare for the next round</li>
                                        <li>✅ View past performance in read-only mode</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Budget Modes Tab */}
                    <TabsContent value="budgets" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-2xl">💎</span>
                                    Budget Difficulty Modes
                                </CardTitle>
                                <CardDescription>
                                    Three preset budget levels for Marketplace leagues
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-blue-900 dark:text-blue-100">🧠 Budget Genius</span>
                                        <span className="font-bold text-blue-600 dark:text-blue-400">€10M</span>
                                    </div>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        "Big brain, small wallet" - Requires smart picks and deep player knowledge. No room for expensive stars!
                                    </p>
                                </div>

                                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-green-900 dark:text-green-100">⚖️ Balanced Baller</span>
                                        <span className="font-bold text-green-600 dark:text-green-400">€17.5M</span>
                                    </div>
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        "Working hard, playing smart" - Default mode. Mix 2-3 stars with solid role players.
                                    </p>
                                </div>

                                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-purple-900 dark:text-purple-100">💎 Rich Dad Mode</span>
                                        <span className="font-bold text-purple-600 dark:text-purple-400">€25M</span>
                                    </div>
                                    <p className="text-sm text-purple-800 dark:text-purple-200">
                                        "Buy everyone, ask questions later" - Easy mode. Stack multiple superstars on your roster!
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AuthenticatedLayout>
    );
}
