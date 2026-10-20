import { Link, createFileRoute } from '@tanstack/react-router'
import { useAuth } from '../auth/auth-context'
import { buttonVariants } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { user, status } = useAuth()
  console.log('HomePage user:', user)
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl">
            TanStack Start × NestJS auth
          </CardTitle>
          <CardDescription className="text-base">
            JWT access token in memory with a refresh-token session in an
            httpOnly cookie.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Session status */}
          <div className="rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">Session status</p>

            <p className="mt-1 font-medium">
              <code className="rounded bg-muted px-2 py-1 text-sm">
                {status}
              </code>
            </p>
          </div>

          {/* User profile */}
          {user ? (
            <div className="flex items-center gap-4 rounded-lg border bg-background p-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.name || user.email}'s avatar`}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="font-semibold">{user.name || 'Signed-in user'}</p>
                <p className="break-all text-sm text-muted-foreground">
                  {user.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Role: {user.role}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sign in to view your profile and access the dashboard.
            </p>
          )}

          {/* Navigation */}
          <div className="flex flex-wrap gap-3">
            {status === 'authenticated' ? (
              <Link className={buttonVariants()} to="/dashboard">
                Go to dashboard →
              </Link>
            ) : (
              <Link className={buttonVariants()} to="/login">
                Sign in →
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
