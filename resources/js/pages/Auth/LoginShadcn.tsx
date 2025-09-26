import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import { home, login, register } from '@/routes';
import password from '@/routes/password';
import { Link, useForm } from '@inertiajs/react';
import { CheckCircle, Lock, Mail, Zap } from 'lucide-react';
import { FormEventHandler } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function LoginShadcn({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(login.url(), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="absolute inset-0 opacity-20">
                <div className="h-full w-full" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
            </div>

            <div className="relative flex min-h-screen">
                <div className="flex w-full items-center justify-center px-4 sm:px-6 lg:px-8">
                    <div className="w-full max-w-md space-y-8">
                        <div className="absolute top-6 right-6">
                            <ThemeToggle />
                        </div>

                        <div className="text-center">
                            <Link
                                href={home.url()}
                                className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                                <Zap className="w-8 h-8" />
                            </Link>
                        </div>

                        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-700/20">
                            <CardHeader className="text-center">
                                <CardTitle className="text-3xl font-bold tracking-tight">
                                    Welcome back
                                </CardTitle>
                                <CardDescription>
                                    Sign in to your account to continue
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {status && (
                                    <div className="mb-4 rounded-lg bg-green-100 border border-green-200 p-4 text-sm font-medium text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4" />
                                            {status}
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={submit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                required
                                                autoComplete="username"
                                                className="pl-10"
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="text-sm text-destructive">{errors.email}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                                            <Input
                                                id="password"
                                                type="password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                required
                                                autoComplete="current-password"
                                                className="pl-10"
                                                placeholder="Enter your password"
                                            />
                                        </div>
                                        {errors.password && (
                                            <p className="text-sm text-destructive">{errors.password}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="remember"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 bg-white/50 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700"
                                            />
                                            <Label htmlFor="remember" className="text-sm font-medium">
                                                Remember me
                                            </Label>
                                        </div>

                                        {canResetPassword && (
                                            <Link
                                                href={password.request.url()}
                                                className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                                            >
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {processing ? 'Signing in...' : 'Sign in'}
                                    </Button>

                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground">
                                            Don't have an account?{' '}
                                            <Link
                                                href={register.url()}
                                                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                                            >
                                                Sign up
                                            </Link>
                                        </p>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}