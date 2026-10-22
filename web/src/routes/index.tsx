import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, UserPlus } from 'lucide-react'
import { useAuth } from '../auth/auth-context'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleSignIn = () => {
    void router.navigate({ to: '/login' })
  }

  const handleSignUp = () => {
    void router.navigate({ to: '/register' })
  }

  const handleGoToDashboard = () => {
    void router.navigate({ to: '/dashboard' })
  }

  const handleGoToAdmin = () => {
    void router.navigate({ to: '/admin' })
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch {}
    void router.navigate({ to: '/login', replace: true })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="size-6" />
            <CardTitle className="text-2xl font-bold tracking-tight">
              Trackio
            </CardTitle>
          </div>
          <CardDescription>
            Real-time delivery agent tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {user ? (
            <>
              <div className="flex gap-2 mb-4">
                {user.role === 'admin' ? (
                  <Button onClick={handleGoToAdmin} className="flex-1">
                    Go to Admin Panel →
                  </Button>
                ) : (
                  <Button onClick={handleGoToDashboard} className="flex-1">
                    Go to Dashboard →
                  </Button>
                )}
              </div>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full"
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleSignIn} className="w-full">
                Sign in
              </Button>
              <Button variant="outline" onClick={handleSignUp} className="w-full">
                <UserPlus className="mr-2 size-4" /> Create account
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="text-center">
          {user ? (
            <p className="text-xs text-muted-foreground">
              Logged in as {user.role}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Delivery agent fleet management for admins and agents.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
