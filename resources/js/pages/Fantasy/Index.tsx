import React, { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, Plus, LogIn, Zap } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

interface Championship {
    id: number
    name: string
    season: string
}

interface FantasyLeague {
    id: number
    name: string
    description: string
    mode: 'budget' | 'draft'
    budget: number
    team_size: number
    is_private: boolean
    max_members: number
    owner: {
        id: number
        name: string
    }
    championship: Championship
    teams_count?: number
}

interface Props {
    userLeagues: FantasyLeague[]
}

export default function Index({ userLeagues = [] }: Props) {
    // Filter out any null/undefined leagues
    const validLeagues = userLeagues.filter(Boolean)
    const [open, setOpen] = useState(false)
    const { data, setData, post, processing, errors, reset } = useForm({
        invite_code: '',
    })

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault()
        post('/fantasy/leagues/join', {
            onSuccess: () => {
                reset()
                setOpen(false)
            },
        })
    }

    return (
        <AuthenticatedLayout>
            <Head title="Fantasy Leagues" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                                <h2 className="text-2xl font-bold text-foreground">Fantasy Basketball</h2>
                            </div>
                            <p className="text-muted-foreground mt-1">
                                Create your dream team and compete with friends
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex items-center justify-center gap-2 flex-1 sm:flex-initial">
                                        <LogIn className="h-4 w-4" />
                                        <span className="hidden sm:inline">Join League</span>
                                        <span className="sm:hidden">Join</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Join Fantasy League</DialogTitle>
                                        <DialogDescription>
                                            Enter the invite code to join an existing league
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleJoin} className="space-y-4">
                                        <div>
                                            <Label htmlFor="invite_code">Invite Code</Label>
                                            <Input
                                                id="invite_code"
                                                value={data.invite_code}
                                                onChange={(e) => setData('invite_code', e.target.value.toUpperCase())}
                                                placeholder="ABC123"
                                                className="uppercase"
                                                maxLength={6}
                                            />
                                            {errors.invite_code && (
                                                <p className="text-sm text-red-600 mt-1">{errors.invite_code}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setOpen(false)}
                                                disabled={processing}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={processing}>
                                                {processing ? 'Joining...' : 'Join League'}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                            <Link href="/fantasy/leagues/create" className="flex-1 sm:flex-initial">
                                <Button className="flex items-center justify-center gap-2 w-full">
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Create League</span>
                                    <span className="sm:hidden">Create</span>
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {validLeagues.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No fantasy leagues yet</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Create your first league or join one with an invite code
                                </p>
                                <div className="flex gap-2">
                                    <Link href="/fantasy/leagues/create">
                                        <Button>Create League</Button>
                                    </Link>
                                    <Button variant="outline" onClick={() => setOpen(true)}>Join League</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {validLeagues.map((league) => {
                                const isBudget = league.mode === 'budget'
                                const gradientColors = isBudget
                                    ? 'from-emerald-500 to-teal-600'
                                    : 'from-amber-500 to-orange-600'
                                const hoverShadow = isBudget
                                    ? 'hover:shadow-emerald-500/20'
                                    : 'hover:shadow-amber-500/20'
                                const hoverBorder = isBudget
                                    ? 'hover:border-emerald-400/50'
                                    : 'hover:border-amber-400/50'
                                const bgGradient = isBudget
                                    ? 'to-emerald-50/30 dark:to-emerald-950/20'
                                    : 'to-amber-50/30 dark:to-amber-950/20'
                                const hoverTextColor = isBudget
                                    ? 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                                    : 'group-hover:text-amber-600 dark:group-hover:text-amber-400'

                                return (
                                    <Card
                                        key={league.id}
                                        className={`group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl ${hoverShadow} hover:-translate-y-1 ${hoverBorder} bg-gradient-to-br from-white ${bgGradient} dark:from-slate-900`}
                                    >
                                        {/* Animated gradient overlay on hover */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors.replace('from-', 'from-').replace('to-', 'to-').split(' ').map(c => c + '/0').join(' ')} group-hover:${gradientColors.replace('from-', 'from-').replace('to-', 'to-').split(' ').map(c => c + '/5').join(' ')} transition-all duration-500`} />

                                        <CardHeader className="relative">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className={`flex items-center gap-2 text-lg ${hoverTextColor} transition-colors`}>
                                                        {league.name}
                                                    </CardTitle>
                                                    {league.description && (
                                                        <CardDescription className="mt-1 line-clamp-2">
                                                            {league.description}
                                                        </CardDescription>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    {league.is_private && (
                                                        <Badge variant="secondary" className={`${isBudget ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                                                            Private
                                                        </Badge>
                                                    )}
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs font-bold ${isBudget ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}
                                                    >
                                                        {league.mode === 'budget' ? '💰 Budget' : '🎲 Draft'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gradientColors} text-white shadow-lg`}>
                                                        <Users className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="text-foreground">
                                                        {league.teams_count || 0}/{league.max_members}
                                                    </span>
                                                </div>
                                                {league.championship && (
                                                    <div className="text-xs font-medium text-muted-foreground">
                                                        <Trophy className="inline h-3 w-3 mr-1" />
                                                        {league.championship.season}
                                                    </div>
                                                )}
                                            </div>
                                            <Link href={`/fantasy/leagues/${league.id}`}>
                                                <Button
                                                    size="sm"
                                                    className={`w-full bg-gradient-to-r ${gradientColors} hover:${gradientColors.replace('500', '600').replace('600', '700')} text-white shadow-lg ${isBudget ? 'shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40' : 'shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40'} transition-all`}
                                                >
                                                    View League
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
