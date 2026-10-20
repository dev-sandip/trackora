import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

import { useAuth } from '../auth/auth-context'
import { sessionQueryOptions } from '../auth/session.queries'
import { getApiErrorMessage } from '../lib/api'

import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { toast } from '#/components/ui/pill-toaster'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),

  beforeLoad: async ({ context }) => {
    if (typeof window === 'undefined') return

    const session = await context.queryClient.query(sessionQueryOptions)

    if (session) {
      throw redirect({ to: '/' })
    }
  },

  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  const router = useRouter()
  const { login, isLoggingIn, error } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      await login({ email, password })

      // Only allow local application paths.
      const target =
        search.redirect?.startsWith('/') && !search.redirect.startsWith('//')
          ? search.redirect
          : '/'

      await router.navigate({ href: target, replace: true })
    } catch {
      toast({
        message: 'Sign-in failed. Please check your credentials and try again.',
        state: 'error',
      })
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldCheck className="size-7" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue to your account.
          </p>
        </div>

        {/* Login card */}
        <Card className="border-slate-200/80 bg-white/90 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
          <CardHeader className="space-y-1 pb-5">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>

          <form onSubmit={onSubmit}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoggingIn}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password">Password</Label>
                  {/* Add a forgot-password route here if supported. */}
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isLoggingIn}
                    className="h-11 pr-11"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                    disabled={isLoggingIn}
                    className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error ? (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>
                    {getApiErrorMessage(error, 'Sign-in failed')}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="h-11 w-full gap-2 font-medium shadow-sm"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </form>

          <CardFooter className="justify-center border-t px-6 py-4">
            <p className="text-center text-xs text-muted-foreground">
              Protected authentication powered by NestJS Passport.
            </p>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Secure access to your account
        </p>
      </div>
    </main>
  )
}
