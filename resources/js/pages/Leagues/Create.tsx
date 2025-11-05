import React from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Users } from 'lucide-react'
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
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href="/leagues" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Leagues
                        </Link>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Create New League
                            </CardTitle>
                            <CardDescription>
                                Set up your prediction league and invite friends to compete. You can create up to 3 prediction leagues ({userCreatedLeaguesCount}/3).
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
                                    <Link href="/leagues" className="flex-1">
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