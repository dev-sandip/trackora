import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  User,
  LogOut,
  Activity,
} from 'lucide-react'

import { useAuth } from '@/auth/auth-context'
import { sessionQueryOptions } from '@/auth/session.queries'
import { adminApi } from '@/lib/api'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const Route = createFileRoute('/admin/')({
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
  component: AdminDashboard,
})

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'default',
}: {
  title: string
  value: React.ReactNode
  description: string
  icon: React.ComponentType<any>
  variant?: 'default' | 'destructive'
}) {
  return (
    <Card className={variant === 'destructive' ? 'border-destructive/50' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function AdminDashboard() {
  const { user, logout, isLoggingOut } = useAuth()

  const [activeTab, setActiveTab] = useState<'agents' | 'users'>('agents')

  const agentsQuery = useQuery({
    queryKey: ['admin', 'agents'],
    queryFn: () => adminApi.listAgents(),
    staleTime: 1000 * 30,
  })

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.getAllUsers(),
    staleTime: 1000 * 60,
  })

  const agents = agentsQuery.data ?? []
  const users = usersQuery.data ?? []

  const onlineAgents = agents.filter((a) => a.isOnline).length
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.isActive).length

  const handleLogout = async () => {
    try {
      await logout()
    } catch {}
  }

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <User className="size-5" />
            </div>
            <div>
              <h1 className="font-semibold tracking-tight">Trackio Admin</h1>
              <p className="text-xs text-muted-foreground">
                Delivery agent fleet management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
              <AvatarFallback>
                {user?.name}
              </AvatarFallback>
            </Avatar>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{user?.name}</p>
              <p className="text-xs text-muted-foreground leading-none">
                {user?.role === 'admin' ? 'Administrator' : 'Agent'}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2"
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>

        <nav className="flex items-center gap-1 border-b px-6 py-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger
                value="agents"
                className={activeTab === 'agents' ? '' : 'text-muted-foreground'}
              >
                <Activity className="mr-2 size-4" /> Agents
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className={activeTab === 'users' ? '' : 'text-muted-foreground'}
              >
                <Users className="mr-2 size-4" /> Users
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Agents"
            value={agents.length}
            description="Registered delivery agents"
            icon={User}
          />
          <StatCard
            title="Online Now"
            value={onlineAgents}
            description="Agents currently available"
            icon={CheckCircle2}
          />
          <StatCard
            title="Total Users"
            value={totalUsers}
            description="All registered accounts"
            icon={Users}
          />
          <StatCard
            title="Active Users"
            value={activeUsers}
            description="Active accounts"
            icon={Clock}
            variant="destructive"
          />
        </div>

        {activeTab === 'agents' ? (
          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Agent Fleet</h2>
              <Link to="/admin/agents">
                <Button size="sm" variant="outline">
                  Manage All
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-center">Vehicle</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Online</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.slice(0, 8).map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="midium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
                              {agent.user?.name?.charAt(0).toUpperCase() ||
                              agent.userId.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-none">
                              {agent.user?.name || 'Agent'}
                            </p>
                            <p className="text-xs text-muted-foreground leading-none">
                              {agent.userId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs text-muted-foreground">
                          {agent.vehicleType ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {agent.status.charAt(0).toUpperCase() +
                          agent.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={agent.isOnline ? 'default' : 'secondary'}
                          className="h-6 w-6 px-1.5 py-0 text-[10px]"
                        >
                          {agent.isOnline ? '●' : '○'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-medium">
                          {agent.currentOrderId ? '1' : '0'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {agents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                        No agents found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {agents.length > 8 && (
              <p className="mt-4 text-sm text-muted-foreground">
                Showing {Math.min(8, agents.length)} of {agents.length} agents.
              </p>
            )}
          </section>
        ) : (
          <section>
            <h2 className="text-lg font-semibold">Users</h2>
            <div className="rounded-lg border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-center">Role</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
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
                            <p className="text-xs text-muted-foreground leading-none">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{u.role}</Badge>
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
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        )}
      </main>
    </div>
    </AdminLayout>
  )
}
