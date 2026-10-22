import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'

import { useAuth } from '../auth/auth-context'
import { sessionQueryOptions } from '../auth/session.queries'

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
import { toast } from '#/components/ui/pill-toaster'

export const Route = createFileRoute('/register')({
  beforeLoad: async ({ context }) => {
    if (typeof window === 'undefined') return
    const session = await context.queryClient.query(sessionQueryOptions)
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: RegisterPage,
})

function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsRegistering(true)

    try {
      await register({ name, email, password })

      await router.navigate({ href: '/login', replace: true })

      toast({
        message: 'Account created successfully. Please sign in.',
        state: 'success',
      })
    } catch {
      toast({
        message: 'Registration failed. Please try again.',
        state: 'error',
      })
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border border-border/50 bg-card shadow-sm">
        <CardHeader className="text-center space-y-2 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create account
          </CardTitle>
          <CardDescription>
            Join Trackio to start tracking your delivery fleet.
          </CardDescription>
        </CardHeader>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isRegistering}
            />
          </div>

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
              disabled={isRegistering}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isRegistering}
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
                disabled={isRegistering}
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

          <Button
            type="submit"
            disabled={isRegistering}
            className="w-full gap-2 font-medium"
          >
            {isRegistering ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        <CardFooter className="border-t px-6 py-4">
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <span
              className="text-primary cursor-pointer underline underline-offset-4"
              onClick={() => void router.navigate({ to: '/login' })}
            >
              Sign in
            </span>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
