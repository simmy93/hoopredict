import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { login, register } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { Trophy, Users, Target, TrendingUp, Star, Sparkles } from 'lucide-react';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Basketball pattern background */}
            <div className="absolute inset-0 opacity-10 dark:opacity-20">
                <div className="h-full w-full" style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF6B35' fill-opacity='0.4'%3E%3Ccircle cx='40' cy='40' r='16'/%3E%3Ccircle cx='40' cy='40' r='8'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
                }}></div>
            </div>

            <div className="relative">
                <div className="absolute top-6 right-6">
                    <ThemeToggle />
                </div>

                <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        {/* Basketball Icon */}
                        <div className="inline-flex items-center justify-center w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full shadow-2xl animate-bounce">
                            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9l5.31 5.31V16h1v-3.59l5.31-5.31C18.37 8.45 20 10.15 20 12c0 4.41-3.59 8-8 8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
                            <span className="bg-gradient-to-r from-orange-600 via-red-600 to-purple-600 bg-clip-text text-transparent">
                                HoopPredict
                            </span>
                        </h1>

                        <p className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                            Where Basketball Predictions Meet Competition! 🏀
                        </p>

                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
                            Think you know basketball? Prove it! Create your league, challenge your friends,
                            predict game scores, and build your fantasy team. Show off your basketball IQ, climb the leaderboards,
                            and claim bragging rights as the ultimate champion!
                        </p>

                        <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-4 py-2 rounded-full mb-8">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">New: Fantasy Basketball Mode Available Now!</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                            <Link href={register.url()}>
                                <Button size="lg" className="min-w-[180px] bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg">
                                    Start Competing
                                </Button>
                            </Link>
                            <Link href={login.url()}>
                                <Button variant="outline" size="lg" className="min-w-[180px] border-2">
                                    Sign In
                                </Button>
                            </Link>
                        </div>

                        {/* Features Grid */}
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 hover:scale-105 transition-transform duration-200">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl flex items-center justify-center mb-4 mx-auto">
                                    <Trophy className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Create Leagues
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Start your own prediction league and invite friends to compete against each other!
                                </p>
                            </div>

                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 hover:scale-105 transition-transform duration-200">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mb-4 mx-auto">
                                    <Target className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Predict Scores
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Make your predictions before tipoff and earn points based on your accuracy!
                                </p>
                            </div>

                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 hover:scale-105 transition-transform duration-200">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center mb-4 mx-auto">
                                    <TrendingUp className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Track Rankings
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Watch your position rise on the leaderboard as you nail those predictions!
                                </p>
                            </div>

                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 hover:scale-105 transition-transform duration-200">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mb-4 mx-auto">
                                    <Users className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Compete & Brag
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Battle your friends and earn ultimate bragging rights as the prediction master!
                                </p>
                            </div>
                        </div>

                        {/* Fantasy Mode Section */}
                        <div className="mt-16 max-w-3xl mx-auto bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-200/50 dark:border-purple-700/50 p-8">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Fantasy Basketball Mode
                                </h3>
                                <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                Build your dream team from real EuroLeague players! Buy and sell players with your budget,
                                watch their prices change based on performance, and compete in fantasy leagues with friends.
                            </p>
                            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div>✓ Budget Mode</div>
                                <div>✓ Dynamic Pricing</div>
                                <div>✓ Live Stats</div>
                                <div>✓ Player Marketplace</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}