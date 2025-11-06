import React from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Users, Info, Shield } from 'lucide-react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

interface Props {
    userCreatedLeaguesCount: number
}

export default function Create({ userCreatedLeaguesCount }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        is_private: false,
        max_members: 50
    })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        post('/leagues')
    }

    return (
        <AuthenticatedLayout>
            <Head title="Create League" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href="/leagues" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Leagues
                        </Link>
                    </div>

                    <Card className="border-2 shadow-xl">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                            <CardTitle className="flex items-center gap-3 text-2xl">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                                Create New League
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                Set up your prediction league and invite friends to compete. You can create up to 3 prediction leagues ({userCreatedLeaguesCount}/3).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={submit} className="space-y-8">
                                {/* Basic Info Section */}
                                <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
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
                                <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                                        <Users className="h-4 w-4" />
                                        League Settings
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_members">Maximum Members</Label>
                                        <Input
                                            id="max_members"
                                            type="number"
                                            min="2"
                                            max="50"
                                            value={data.max_members}
                                            onChange={(e) => setData('max_members', parseInt(e.target.value))}
                                            className={errors.max_members ? 'border-red-500' : ''}
                                        />
                                        {errors.max_members && <p className="text-sm text-red-600">{errors.max_members}</p>}
                                        <p className="text-sm text-muted-foreground">
                                            Set the maximum number of members for your league (2-50)
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-md bg-white/50 dark:bg-black/10 border border-amber-100 dark:border-amber-900">
                                        <div className="space-y-1 flex-1">
                                            <Label htmlFor="is_private" className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                Private League
                                            </Label>
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
                                </div>

                                <div className="flex gap-3 pt-6 border-t mt-8">
                                    <Link href="/leagues" className="flex-1">
                                        <Button type="button" variant="outline" className="w-full h-12 text-base">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                                    >
                                        {processing ? (
                                            <>Creating League...</>
                                        ) : (
                                            <>
                                                <Users className="mr-2 h-5 w-5" />
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
    )
}