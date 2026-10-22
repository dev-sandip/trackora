import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'

import { useAuth } from '../auth/auth-context'
import { sessionQueryOptions } from '../auth/session.queries'
import { getApiErrorMessage } from '../lib/api'

import { Button } from '../components/ui/button'
import {
  Card,
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border border-border/50 bg-card shadow-sm">
        <CardHeader className="text-center space-y-2 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription>
            Sign in to your account
          </CardDescription>
        </CardHeader>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
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
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">Password</Label>
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
                className="pr-10"
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
                className="absolute right-2 top-1/2 size-5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
            className="w-full gap-2 font-medium"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        <CardFooter className="border-t px-6 py-4">
          <p className="text-center text-xs text-muted-foreground">
            Need an account?{' '}
            <span
              className="text-primary cursor-pointer underline underline-offset-4"
              onClick={() => void router.navigate({ to: '/register' })}
            >
              Create one
            </span>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
