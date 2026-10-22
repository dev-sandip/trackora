import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'

import { useAuth } from '@/auth/auth-context'
import { sessionQueryOptions } from '@/auth/session.queries'
import { adminApi } from '@/lib/api'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: async ({ context, location }) => {
    if (typeof window === 'undefined') return
    const session = await context.queryClient.query(sessionQueryOptions)
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    if (session.role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: UsersPage,
})

function UsersPage() {
  const { user, logout } = useAuth()
  const [roleFilter, setRoleFilter] = useState<'agent' | 'admin' | ''>('')

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', roleFilter],
    queryFn: () => adminApi.getAllUsers(),
    staleTime: 1000 * 60,
  })

  const users = usersQuery.data ?? []

  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false
    return true
  })

  const handleLogout = async () => {
    try {
      await logout()
    } catch {}
  }

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h1 className="font-semibold tracking-tight">Users</h1>
              <p className="text-xs text-muted-foreground">
                Manage platform accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="sm">← Back to dashboard</Button>
            </Link>
            <Avatar className="h-9 w-9">
              <AvatarFallback>
                {user?.name.charAt(0).toUpperCase() ||
                user?.email.charAt(0).toUpperCase() ||
                'U'}
              </AvatarFallback>
            </Avatar>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 space-y-8">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-semibold">All Users</h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length} of {users.length} users
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="role-filter">Role</Label>
            <Input
              id="role-filter"
              type="text"
              list="role-options"
              placeholder="agent / admin"
              value={roleFilter}
              onChange={(e) => {
                const v = e.target.value.toLowerCase()
                setRoleFilter(
                  v === 'agent' || v === 'admin' ? (v) : ''
                )
              }}
            />
            <datalist id="role-options">
              <option value="agent" />
              <option value="admin" />
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <CardDescription>{users.length}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Agents</CardTitle>
              <CardDescription>
                {users.filter((u) => u.role === 'agent').length}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <CardDescription>
                {users.filter((u) => u.role === 'admin').length}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-center">Email</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="midium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar ?? undefined} alt={u.name} />
                        <AvatarFallback>{u.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-none">
                          {u.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <p className="text-sm text-muted-foreground leading-none break-all">
                      {u.email}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={u.role === 'admin' ? 'outline' : 'secondary'}
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={u.isActive ? 'default' : 'secondary'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-sm text-muted-foreground"
                  >
                    No users match the current filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
    </AdminLayout>
  )
}
