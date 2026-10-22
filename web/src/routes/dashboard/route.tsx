import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useAuth } from '../../auth/auth-context'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user, logout, logoutAll, isLoggingOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
    } catch {}
    await router.navigate({ to: '/login', replace: true })
  }

  const handleLogoutAll = async () => {
    try {
      await logoutAll()
    } catch {}
    await router.navigate({ to: '/login', replace: true })
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name || 'User'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'U'}
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your account settings and session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {user?.name || 'Signed-in user'}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  Role: {user?.role}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Session
              </p>
              <div className="mt-2 space-y-2">
                <Button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  variant="destructive"
                  className="w-full"
                >
                  {isLoggingOut ? 'Signing out…' : 'Sign out'}
                </Button>
                <Button
                  onClick={handleLogoutAll}
                  disabled={isLoggingOut}
                  variant="outline"
                  className="w-full"
                >
                  Sign out of all devices
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {user?.role === 'admin' && (
          <div className="mt-8">
            <Link to="/admin">
              <Button className="w-full">
                Go to Admin Panel →
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
