import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  User,
  Bike,
  Scooter,
  Car,
  Van,
  ChevronRight,
} from 'lucide-react'

import { useAuth } from '@/auth/auth-context'
import { sessionQueryOptions } from '@/auth/session.queries'
import { adminApi } from '@/lib/api'
import type { AgentStatus, CreateAgentInput, ListAgentsQuery, VehicleType } from '@/lib/types'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { toast } from '@/components/ui/pill-toaster'

export const Route = createFileRoute('/admin/agents')({
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
  component: AgentsPage,
})

const VEHICLE_ICONS: Record<string, React.ComponentType<any>> = {
  bike: Bike,
  scooter: Scooter,
  car: Car,
  van: Van,
}

const vehicleLabel = (type?: string | null) => {
  if (!type) return '—'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function StatusCell({ status }: { status: string }) {
  const variants: Record<string, string> = {
    available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    busy: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    break: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    offline: 'bg-muted text-muted-foreground dark:bg-muted/50',
    suspended: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
  }
  return (
    <Badge variant="outline" className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

function AgentsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState<ListAgentsQuery>({})
  const createMutation = useMutation({
    mutationFn: (input: CreateAgentInput) => adminApi.createAgent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] })
      toast({ message: 'Agent created successfully', state: 'success' })
    },
    onError: () => {
      toast({ message: 'Failed to create agent', state: 'error' })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] })
      toast({ message: 'Agent deleted successfully', state: 'success' })
    },
    onError: () => {
      toast({ message: 'Failed to delete agent', state: 'error' })
    },
  })
  const queryClient = useQueryClient()
  const [userIdInput, setUserIdInput] = useState('')
  const [vehicleTypeInput, setVehicleTypeInput] = useState<VehicleType>('bike')
  const [vehiclePlateInput, setVehiclePlateInput] = useState('')
  const [maxOrdersInput, setMaxOrdersInput] = useState('')
  const isPending = createMutation.isPending || deleteMutation.isPending

  const agentsQuery = useQuery({
    queryKey: ['admin', 'agents', query],
    queryFn: () => adminApi.listAgents(query),
    staleTime: 1000 * 30,
  })

  const agents = agentsQuery.data ?? []

  const filtered = agents.filter((a) => {
    if (query.status && a.status !== query.status) return false
    if (query.isOnline !== undefined && a.isOnline !== query.isOnline)
      return false
    if (query.vehicleType && a.vehicleType !== query.vehicleType) return false
    if (query.isActive !== undefined && a.isActive !== query.isActive)
      return false
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
              <User className="size-5" />
            </div>
            <div>
              <h1 className="font-semibold tracking-tight">Agent Fleet</h1>
              <p className="text-xs text-muted-foreground">
                Manage delivery agents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button >
              <a href="/admin">← Back to dashboard</a>
            </Button>
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

      <Sheet>
        <SheetTrigger>
          <Button variant="outline" size="sm">Create Agent</Button>
        </SheetTrigger>
        <SheetContent className="w-[420px]">
          <SheetHeader>
            <SheetTitle>Create Agent</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const input: CreateAgentInput = {
                userId: userIdInput,
                vehicleType: vehicleTypeInput,
                vehiclePlate: vehiclePlateInput,
                maxConcurrentOrders: Number(maxOrdersInput),
              }
              createMutation.mutate(input)
            }}
          >
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="create-user-id">User ID</Label>
                <Input
                  id="create-user-id"
                  type="text"
                  placeholder="e.g. user_123"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-vehicle-type">Vehicle type</Label>
                <Input
                  id="create-vehicle-type"
                  type="text"
                  list="vehicle-options"
                  placeholder="bike / scooter / car / van"
                  value={vehicleTypeInput}
                  onChange={(e) =>
                    setVehicleTypeInput(e.target.value as VehicleType)
                  }
                  disabled={isPending}
                />
                <datalist id="vehicle-options">
                  <option value="bike" />
                  <option value="scooter" />
                  <option value="car" />
                  <option value="van" />
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-vehicle-plate">Vehicle plate</Label>
                <Input
                  id="create-vehicle-plate"
                  type="text"
                  placeholder="BA 12 PA 3456"
                  value={vehiclePlateInput}
                  onChange={(e) => setVehiclePlateInput(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-max-orders">Max concurrent orders</Label>
                <Input
                  id="create-max-orders"
                  type="number"
                  min={1}
                  max={10}
                  placeholder="e.g. 2"
                  value={maxOrdersInput}
                  onChange={(e) => setMaxOrdersInput(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Creating…' : 'Create Agent'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <main className="flex-1 px-6 py-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Agents</h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length} of {agents.length} agents
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Input
              placeholder="Search agents…"
              className="w-full lg:w-64"
              value={query.status || ''}
              onChange={(e) => {
                const v = e.target.value.toLowerCase()
                setQuery((q) => ({
                  ...q,
                  status: (v === 'available' || v === 'busy' || v === 'break' || v === 'offline' || v === 'suspended' ? v : undefined),
                }))
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="border-b border-border bg-card py-4">
            <div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground">Total</p>
              <p className="text-2xl font-bold tracking-tight">{agents.length}</p>
            </div>
          </div>
          <div className="border-b border-border bg-card py-4">
            <div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground">Online</p>
              <p className="text-2xl font-medium text-green-600 dark:text-green-400">
                {agents.filter((a) => a.isOnline).length}
              </p>
            </div>
          </div>
          <div className="border-b border-border bg-card py-4">
            <div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground">Offline</p>
              <p className="text-2xl font-medium text-muted-foreground">
                {agents.filter((a) => !a.isOnline).length}
              </p>
            </div>
          </div>
          <div className="border-b border-border bg-card py-4">
            <div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground">Suspended</p>
              <p className="text-2xl font-medium text-destructive">
                {agents.filter((a) => a.status === 'suspended').length}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter">Status</Label>
          <Input
            id="status-filter"
            type="text"
            list="status-options"
            placeholder="e.g. available"
            value={query.status || ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                status: (e.target.value.toLowerCase() === 'available' || e.target.value.toLowerCase() === 'busy' || e.target.value.toLowerCase() === 'break' || e.target.value.toLowerCase() === 'offline' || e.target.value.toLowerCase() === 'suspended' ? e.target.value.toLowerCase() : undefined) as AgentStatus | undefined,
              }))
            }
          />
          <datalist id="status-options">
            <option value="available" />
            <option value="busy" />
            <option value="break" />
            <option value="offline" />
            <option value="suspended" />
          </datalist>

          <Label htmlFor="online-filter" className="ml-4">Online</Label>
          <Input
            id="online-filter"
            type="text"
            list="online-options"
            placeholder="true/false"
            value={query.isOnline !== undefined ? String(query.isOnline) : ''}
            onChange={(e) => {
              const v = e.target.value.toLowerCase()
              setQuery((q) => ({
                ...q,
                isOnline: v === 'true' ? true : v === 'false' ? false : undefined,
              }))
            }}
          />
          <datalist id="online-options">
            <option value="true" />
            <option value="false" />
          </datalist>

          <Label htmlFor="vehicle-filter" className="ml-4">Vehicle</Label>
          <Input
            id="vehicle-filter"
            type="text"
            list="vehicle-options"
            placeholder="bike/scooter/car/van"
            value={query.vehicleType || ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                vehicleType: (e.target.value.toLowerCase() === 'bike' || e.target.value.toLowerCase() === 'scooter' || e.target.value.toLowerCase() === 'car' || e.target.value.toLowerCase() === 'van' ? e.target.value.toLowerCase() : undefined) as VehicleType | undefined,
              }))
            }
          />
          <datalist id="vehicle-options">
            <option value="bike" />
            <option value="scooter" />
            <option value="car" />
            <option value="van" />
          </datalist>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="midium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={agent.user?.avatar ?? undefined}
                        alt={agent.user?.name}
                      />
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
                    <div className="flex items-center justify-center gap-1">
                      {agent.vehicleType ? (
                        <>
                          <span className="flex items-center gap-1">
                            {(() => {
                              const Icon = VEHICLE_ICONS[agent.vehicleType]
                              return <Icon className="size-3.5" />
                            })()}
                            <span className="text-xs text-muted-foreground">
                              {vehicleLabel(agent.vehicleType)}
                            </span>
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusCell status={agent.status} />
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
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void router.navigate({
                            to: `/admin/agents/${agent.id}`,
                          })
                        }}
                      >
                        View <ChevronRight className="ml-1 size-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                    No agents match the current filters.
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
