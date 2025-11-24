import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { cn } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, DollarSign, Info, Shield, Trophy, Users } from 'lucide-react';
import React from 'react';

interface Championship {
    id: number;
    name: string;
    season: string;
}

interface Props {
    championships: Championship[];
    userCreatedLeaguesCount: number;
}

export default function Create({ championships, userCreatedLeaguesCount }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        championship_id: championships[0]?.id || '',
        mode: 'budget',
        budget: 17500000, // Default to Balanced Baller
        team_size: 12,
        is_private: false,
        max_members: 10,
        draft_date: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/fantasy/leagues');
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create Fantasy League" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href="/fantasy/leagues" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Fantasy Leagues
                        </Link>
                    </div>

                    <Card className="border-2 shadow-xl">
                        <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-purple-50 dark:from-orange-950/20 dark:to-purple-950/20">
                            <CardTitle className="flex items-center gap-3 text-2xl">
                                <div className="rounded-lg bg-gradient-to-br from-orange-500 to-purple-600 p-2 shadow-lg">
                                    <Trophy className="h-6 w-6 text-white" />
                                </div>
                                Create Fantasy League
                            </CardTitle>
                            <CardDescription className="mt-2 text-base">
                                Set up your fantasy basketball league and invite friends to compete. You can create up to 3 fantasy leagues (
                                {userCreatedLeaguesCount}/3).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={submit} className="space-y-8">
                                {/* Basic Info Section */}
                                <div className="space-y-4 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <Info className="h-4 w-4" />
                                        Basic Information
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name">League Name *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Enter league name"
                                            className={errors.name ? 'border-red-500' : ''}
                                        />
                                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Describe your league (optional)"
                                            rows={3}
                                            className={errors.description ? 'border-red-500' : ''}
                                        />
                                        {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                                    </div>
                                </div>

                                {/* League Settings Section */}
                                <div className="space-y-4 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-800 dark:from-blue-950/20 dark:to-indigo-950/20">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                                        <Trophy className="h-4 w-4" />
                                        League Settings
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="championship_id">Championship *</Label>
                                        <select
                                            id="championship_id"
                                            value={data.championship_id.toString()}
                                            onChange={(e) => setData('championship_id', parseInt(e.target.value))}
                                            className={cn(
                                                'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                                                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                                errors.championship_id && 'border-red-500',
                                            )}
                                        >
                                            {championships.map((championship) => (
                                                <option key={championship.id} value={championship.id}>
                                                    {championship.name} – {championship.season}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.championship_id && <p className="text-sm text-red-600">{errors.championship_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="mode">League Mode *</Label>
                                        <div className="relative">
                                            <select
                                                id="mode"
                                                value={data.mode}
                                                onChange={(e) => setData('mode', e.target.value as 'budget' | 'draft')}
                                                className={cn(
                                                    'block w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm',
                                                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                                    'pr-8',
                                                    errors.mode && 'border-red-500',
                                                )}
                                            >
                                                <option value="budget">💰 Budget Mode – Buy/Sell players with money</option>
                                                <option value="draft">🧩 Draft Mode – Take turns picking players</option>
                                            </select>

                                            {/* custom arrow icon */}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>

                                        {errors.mode && <p className="text-sm text-red-600">{errors.mode}</p>}
                                    </div>
                                </div>

                                {data.mode === 'budget' && (
                                    <div className="space-y-4 rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:border-green-800 dark:from-green-950/20 dark:to-emerald-950/20">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-300">
                                            <DollarSign className="h-4 w-4" />
                                            Budget Configuration
                                        </div>
                                        <div className="space-y-3">
                                            <Label>Budget Difficulty *</Label>
                                            <div className="grid gap-3">
                                                {/* Budget Genius */}
                                                <button
                                                    type="button"
                                                    onClick={() => setData('budget', 10000000)}
                                                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                                                        data.budget === 10000000
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">🧠</span>
                                                        <div className="flex-1">
                                                            <div className="text-lg font-semibold">Budget Genius</div>
                                                            <div className="text-sm text-muted-foreground">€10M - Big brain, small wallet</div>
                                                        </div>
                                                        {data.budget === 10000000 && <div className="text-blue-500">✓</div>}
                                                    </div>
                                                </button>

                                                {/* Balanced Baller */}
                                                <button
                                                    type="button"
                                                    onClick={() => setData('budget', 17500000)}
                                                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                                                        data.budget === 17500000
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">⚖️</span>
                                                        <div className="flex-1">
                                                            <div className="text-lg font-semibold">Balanced Baller</div>
                                                            <div className="text-sm text-muted-foreground">€17.5M - Working hard, playing smart</div>
                                                        </div>
                                                        {data.budget === 17500000 && <div className="text-blue-500">✓</div>}
                                                    </div>
                                                </button>

                                                {/* Rich Dad Mode */}
                                                <button
                                                    type="button"
                                                    onClick={() => setData('budget', 25000000)}
                                                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                                                        data.budget === 25000000
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">💎</span>
                                                        <div className="flex-1">
                                                            <div className="text-lg font-semibold">Rich Dad Mode</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                €25M - Buy everyone, ask questions later
                                                            </div>
                                                        </div>
                                                        {data.budget === 25000000 && <div className="text-blue-500">✓</div>}
                                                    </div>
                                                </button>
                                            </div>
                                            {errors.budget && <p className="text-sm text-red-600">{errors.budget}</p>}
                                        </div>
                                    </div>
                                )}

                                {data.mode === 'draft' && (
                                    <div className="space-y-4 rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 dark:border-purple-800 dark:from-purple-950/20 dark:to-pink-950/20">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
                                            <Calendar className="h-4 w-4" />
                                            Draft Configuration
                                        </div>
                                        <div className="space-y-2">
                                            <DateTimePicker
                                                value={data.draft_date}
                                                onChange={(date) => {
                                                    // Convert to ISO string format for Laravel
                                                    setData('draft_date', date ? date.toISOString().slice(0, 16) : '');
                                                }}
                                            />
                                            {errors.draft_date && <p className="text-sm text-red-600">{errors.draft_date}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Team & Privacy Settings Section */}
                                <div className="space-y-4 rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-800 dark:from-amber-950/20 dark:to-orange-950/20">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                                        <Users className="h-4 w-4" />
                                        Team & Privacy Settings
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="team_size">Team Size *</Label>
                                        <Input
                                            id="team_size"
                                            type="number"
                                            min="8"
                                            max="15"
                                            value={data.team_size}
                                            onChange={(e) => setData('team_size', parseInt(e.target.value))}
                                            className={errors.team_size ? 'border-red-500' : ''}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Number of players per team (8-15, min: 3 Guards, 3 Forwards, 2 Centers)
                                        </p>
                                        {errors.team_size && <p className="text-sm text-red-600">{errors.team_size}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_members">Maximum Members *</Label>
                                        <Input
                                            id="max_members"
                                            type="number"
                                            min="2"
                                            max="50"
                                            value={data.max_members}
                                            onChange={(e) => setData('max_members', parseInt(e.target.value))}
                                            className={errors.max_members ? 'border-red-500' : ''}
                                        />
                                        <p className="text-sm text-muted-foreground">Maximum number of teams in this league (2-50)</p>
                                        {errors.max_members && <p className="text-sm text-red-600">{errors.max_members}</p>}
                                    </div>

                                    <div className="flex items-center justify-between rounded-md border border-amber-100 bg-white/50 p-3 dark:border-amber-900 dark:bg-black/10">
                                        <div className="flex-1 space-y-1">
                                            <Label htmlFor="is_private" className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                Private League
                                            </Label>
                                            <p className="text-sm text-muted-foreground">Private leagues require an invite code to join</p>
                                        </div>
                                        <Switch
                                            id="is_private"
                                            checked={data.is_private}
                                            onCheckedChange={(checked) => setData('is_private', checked)}
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3 border-t pt-6">
                                    <Link href="/fantasy/leagues" className="flex-1">
                                        <Button type="button" variant="outline" className="h-12 w-full text-base">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="h-12 flex-1 text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                                    >
                                        {processing ? (
                                            <>Creating League...</>
                                        ) : (
                                            <>
                                                <Trophy className="mr-2 h-5 w-5" />
                                                Create League
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
