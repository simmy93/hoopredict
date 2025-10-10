import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';

declare global {
    interface Window {
        Echo: any;
    }
}

export default function CountdownTest() {
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [duration, setDuration] = useState(60);

    useEffect(() => {
        // Wait for Echo to be available
        const checkEcho = setInterval(() => {
            if (window.Echo) {
                clearInterval(checkEcho);
                setupEcho();
            }
        }, 100);

        const setupEcho = () => {
            console.log('Setting up Echo...');
            const channel = window.Echo.channel('countdown');

            channel.subscribed(() => {
                console.log('✅ Subscribed to countdown channel');
                setIsConnected(true);
            });

            channel.listen('CountdownStarted', (data: { endTime: number; serverTime: number }) => {
                console.log('🔔 CountdownStarted event received:', data);

                // Calculate time offset between server and client
                const clientNow = Date.now();
                const timeOffset = clientNow - data.serverTime;

                // Calculate remaining time
                const remaining = Math.max(0, Math.floor((data.endTime - clientNow + timeOffset) / 1000));
                setCountdown(remaining);
            });
        };

        return () => {
            clearInterval(checkEcho);
            if (window.Echo) {
                window.Echo.leaveChannel('countdown');
            }
        };
    }, []);

    useEffect(() => {
        if (countdown === null || countdown <= 0) return;

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [countdown]);

    const startCountdown = () => {
        router.post('/countdown/start',
            { duration },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    console.log('Countdown started successfully');
                },
                onError: (errors) => {
                    console.error('Error starting countdown:', errors);
                },
            }
        );
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <Head title="Countdown Test - Broadcasting" />
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-2">Countdown Test</h1>
                        <p className="text-gray-400">Testing Laravel Reverb Broadcasting</p>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Connection Status:</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    isConnected
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                }`}>
                                    {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm text-gray-400 mb-2">
                                Duration (seconds)
                            </label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                min="1"
                                max="3600"
                            />
                        </div>

                        <button
                            onClick={startCountdown}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            Start Countdown
                        </button>
                    </div>

                    {countdown !== null && (
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-8 shadow-2xl text-center">
                            <div className="text-7xl font-bold mb-2 font-mono">
                                {formatTime(countdown)}
                            </div>
                            <div className="text-sm text-blue-100">
                                {countdown === 0 ? '✨ Time\'s up!' : '⏱️ Time remaining'}
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <h3 className="text-sm font-semibold mb-2 text-gray-300">Instructions:</h3>
                        <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                            <li>Make sure Laravel Reverb is running: <code className="bg-gray-700 px-2 py-1 rounded">php artisan reverb:start</code></li>
                            <li>Set duration and click "Start Countdown"</li>
                            <li>Open this page in multiple browser tabs to see real-time sync</li>
                            <li>All connected clients will see the countdown update simultaneously</li>
                        </ol>
                    </div>
                </div>
            </div>
        </>
    );
}
