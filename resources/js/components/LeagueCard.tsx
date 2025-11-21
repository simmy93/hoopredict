import { Link } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Trophy, Users } from 'lucide-react'

type ColorTheme = 'purple' | 'emerald' | 'amber'

interface LeagueCardProps {
    id: number
    name: string
    description?: string | null
    isPrivate?: boolean
    memberCount: number
    maxMembers: number
    href: string
    colorTheme?: ColorTheme
    // Optional extras
    isOwner?: boolean
    modeBadge?: {
        label: string
        icon?: string
    }
    seasonLabel?: string
    children?: React.ReactNode
}

const themeClasses: Record<ColorTheme, {
    hoverShadow: string
    hoverBorder: string
    bgGradient: string
    hoverText: string
    gradient: string
    buttonShadow: string
    privateBadge: string
    iconBg: string
}> = {
    purple: {
        hoverShadow: 'hover:shadow-purple-500/20',
        hoverBorder: 'hover:border-purple-400/50',
        bgGradient: 'to-purple-50/30 dark:to-purple-950/20',
        hoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
        gradient: 'from-purple-500 to-blue-600',
        buttonShadow: 'shadow-purple-500/30 hover:shadow-purple-500/40',
        privateBadge: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
        iconBg: 'from-purple-500 to-blue-600',
    },
    emerald: {
        hoverShadow: 'hover:shadow-emerald-500/20',
        hoverBorder: 'hover:border-emerald-400/50',
        bgGradient: 'to-emerald-50/30 dark:to-emerald-950/20',
        hoverText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
        gradient: 'from-emerald-500 to-teal-600',
        buttonShadow: 'shadow-emerald-500/30 hover:shadow-emerald-500/40',
        privateBadge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        iconBg: 'from-emerald-500 to-teal-600',
    },
    amber: {
        hoverShadow: 'hover:shadow-amber-500/20',
        hoverBorder: 'hover:border-amber-400/50',
        bgGradient: 'to-amber-50/30 dark:to-amber-950/20',
        hoverText: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
        gradient: 'from-amber-500 to-orange-600',
        buttonShadow: 'shadow-amber-500/30 hover:shadow-amber-500/40',
        privateBadge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        iconBg: 'from-amber-500 to-orange-600',
    },
}

export default function LeagueCard({
    id,
    name,
    description,
    isPrivate,
    memberCount,
    maxMembers,
    href,
    colorTheme = 'purple',
    isOwner,
    modeBadge,
    seasonLabel,
    children,
}: LeagueCardProps) {
    const theme = themeClasses[colorTheme]

    return (
        <Card
            className={`group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl ${theme.hoverShadow} hover:-translate-y-1 ${theme.hoverBorder} bg-gradient-to-br from-white ${theme.bgGradient} dark:from-slate-900`}
        >
            {/* Animated gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-white/5 group-hover:to-white/5 transition-all duration-500" />

            <CardHeader className="relative">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className={`flex items-center gap-2 text-lg ${theme.hoverText} transition-colors`}>
                            {name}
                            {isOwner && (
                                <Crown className="h-4 w-4 text-amber-500" />
                            )}
                        </CardTitle>
                        {description && (
                            <CardDescription className="mt-1 line-clamp-2">
                                {description}
                            </CardDescription>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        {isPrivate && (
                            <Badge variant="secondary" className={theme.privateBadge}>
                                Private
                            </Badge>
                        )}
                        {modeBadge && (
                            <Badge
                                variant="outline"
                                className={`text-xs font-bold ${theme.privateBadge}`}
                            >
                                {modeBadge.icon && <span className="mr-1">{modeBadge.icon}</span>}
                                {modeBadge.label}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="relative">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${theme.iconBg} text-white shadow-lg`}>
                            <Users className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-foreground">
                            {memberCount}/{maxMembers}
                        </span>
                    </div>
                    {seasonLabel && (
                        <div className="text-xs font-medium text-muted-foreground">
                            <Trophy className="inline h-3 w-3 mr-1" />
                            {seasonLabel}
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Link href={href} className="flex-1">
                        <Button
                            size="sm"
                            className={`w-full bg-gradient-to-r ${theme.gradient} text-white shadow-lg ${theme.buttonShadow} hover:shadow-xl transition-all`}
                        >
                            View League
                        </Button>
                    </Link>
                    {children}
                </div>
            </CardContent>
        </Card>
    )
}
