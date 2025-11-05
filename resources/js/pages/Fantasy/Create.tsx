import React from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { ArrowLeft, Trophy } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

interface Championship {
    id: number
    name: string
    season: string
}

interface Props {
    championships: Championship[]
    userCreatedLeaguesCount: number
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
    })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        post('/fantasy/leagues')
    }

    return (
        <AuthenticatedLayout>
            <Head title="Create Fantasy League" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href="/fantasy/leagues" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Fantasy Leagues
                        </Link>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5" />
                                Create Fantasy League
                            </CardTitle>
                            <CardDescription>
                                Set up your fantasy basketball league and invite friends to compete. You can create up to 3 fantasy leagues ({userCreatedLeaguesCount}/3).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
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

                                <div className="space-y-2">
                                    <Label htmlFor="championship_id">Championship *</Label>
                                    <Select
                                        value={data.championship_id.toString()}
                                        onValueChange={(value) => setData('championship_id', parseInt(value))}
                                    >
                                        <SelectTrigger className={errors.championship_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select championship" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {championships.map((championship) => (
                                                <SelectItem key={championship.id} value={championship.id.toString()}>
                                                    {championship.name} - {championship.season}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.championship_id && <p className="text-sm text-red-600">{errors.championship_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mode">League Mode *</Label>
                                    <Select
                                        value={data.mode}
                                        onValueChange={(value) => setData('mode', value as 'budget' | 'draft')}
                                    >
                                        <SelectTrigger className={errors.mode ? 'border-red-500' : ''}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="budget">Budget Mode - Buy/Sell players with money</SelectItem>
                                            <SelectItem value="draft">Draft Mode - Take turns picking players</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.mode && <p className="text-sm text-red-600">{errors.mode}</p>}
                                </div>

                                {data.mode === 'budget' && (
                                    <div className="space-y-3">
                                        <Label>Budget Difficulty *</Label>
                                        <div className="grid gap-3">
                                            {/* Budget Genius */}
                                            <button
                                                type="button"
                                                onClick={() => setData('budget', 10000000)}
                                                className={`text-left p-4 rounded-lg border-2 transition-all ${
                                                    data.budget === 10000000
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">🧠</span>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-lg">Budget Genius</div>
                                                        <div className="text-sm text-muted-foreground">€10M - Big brain, small wallet</div>
                                                    </div>
                                                    {data.budget === 10000000 && (
                                                        <div className="text-blue-500">✓</div>
                                                    )}
                                                </div>
                                            </button>

                                            {/* Balanced Baller */}
                                            <button
                                                type="button"
                                                onClick={() => setData('budget', 17500000)}
                                                className={`text-left p-4 rounded-lg border-2 transition-all ${
                                                    data.budget === 17500000
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">⚖️</span>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-lg">Balanced Baller</div>
                                                        <div className="text-sm text-muted-foreground">€17.5M - Working hard, playing smart</div>
                                                    </div>
                                                    {data.budget === 17500000 && (
                                                        <div className="text-blue-500">✓</div>
                                                    )}
                                                </div>
                                            </button>

                                            {/* Rich Dad Mode */}
                                            <button
                                                type="button"
                                                onClick={() => setData('budget', 25000000)}
                                                className={`text-left p-4 rounded-lg border-2 transition-all ${
                                                    data.budget === 25000000
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">💎</span>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-lg">Rich Dad Mode</div>
                                                        <div className="text-sm text-muted-foreground">€25M - Buy everyone, ask questions later</div>
                                                    </div>
                                                    {data.budget === 25000000 && (
                                                        <div className="text-blue-500">✓</div>
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                        {errors.budget && <p className="text-sm text-red-600">{errors.budget}</p>}
                                    </div>
                                )}

                                {data.mode === 'draft' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="draft_date">Draft Date & Time</Label>
                                        <DateTimePicker
                                            value={data.draft_date}
                                            onChange={(date) => {
                                                // Convert to ISO string format for Laravel
                                                setData('draft_date', date ? date.toISOString().slice(0, 16) : '');
                                            }}
                                            placeholder="Select draft date and time"
                                            className={errors.draft_date ? 'border-red-500' : ''}
                                        />
                                        {errors.draft_date && <p className="text-sm text-red-600">{errors.draft_date}</p>}
                                    </div>
                                )}

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
                                    <p className="text-sm text-muted-foreground">
                                        Maximum number of teams in this league (2-50)
                                    </p>
                                    {errors.max_members && <p className="text-sm text-red-600">{errors.max_members}</p>}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="is_private">Private League</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Private leagues require an invite code to join
                                        </p>
                                    </div>
                                    <Switch
                                        id="is_private"
                                        checked={data.is_private}
                                        onCheckedChange={(checked) => setData('is_private', checked)}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Link href="/fantasy/leagues" className="flex-1">
                                        <Button type="button" variant="outline" className="w-full">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing} className="flex-1">
                                        {processing ? 'Creating...' : 'Create League'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
