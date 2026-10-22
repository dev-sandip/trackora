import {
  createFileRoute,
  Link,
  redirect,
  useParams,
} from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  User,
  MapPin,
  Clock,
  Battery,
  ChevronLeft,
  Trash2,
  Edit2,
} from 'lucide-react'

import { useAuth } from '@/auth/auth-context'
import { sessionQueryOptions } from '@/auth/session.queries'
import { adminApi } from '@/lib/api'
import type { AgentStatus, UpdateAgentInput, VehicleType } from '@/lib/types'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogTrigger, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/pill-toaster'

export const Route = createFileRoute('/admin/agents/$agentId')({
  beforeLoad: async ({ context, params, location }) => {
    if (typeof window === 'undefined') return
    const session = await context.queryClient.query(sessionQueryOptions)
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    if (session.role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }
    if (!params.agentId) {
      throw new Error('Missing agentId')
    }
  },
  component: AgentDetailPage,
})

const statusVariant = (status: string) => {
  const variants: Record<string, string> = {
    available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    busy: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    break: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    offline: 'bg-muted text-muted-foreground dark:bg-muted/50',
    suspended: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
  }
  return variants[status] || 'bg-muted text-muted-foreground'
}

function AgentDetailPage() {
  const { agentId } = useParams({ strict: false })
  if (!agentId) {
    return <div>No Agent ID</div>
  }
  const { logout } = useAuth()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState('')
  const [editVehicleType, setEditVehicleType] = useState<VehicleType | ''>('')
  const [editVehiclePlate, setEditVehiclePlate] = useState('')
  const [editMaxOrders, setEditMaxOrders] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)

  const agentQuery = useQuery({
    queryKey: ['admin', 'agent', agentId],
    queryFn: () => adminApi.getAgent(agentId),
    staleTime: 1000 * 30,
    enabled: !!agentId,
  })

  const updateMutation = useMutation({
    mutationFn: (input: UpdateAgentInput) =>
      adminApi.updateAgent(agentId, input),
      onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agent', agentId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] })
      toast({ message: 'Agent updated successfully', state: 'success' })
    },
    onError: () => {
      toast({ message: 'Failed to update agent', state: 'error' })
    },
  })

  const agent = agentQuery.data
  const isPending = agentQuery.isPending || updateMutation.isPending

  const saveLabel = updateMutation.isPending ? 'Updating…' : 'Save changes'
  const deactivateLabel = updateMutation.isPending
    ? 'Deactivating…'
    : 'Deactivate'

  useEffect(() => {
    if (agent) {
      setEditVehicleType(agent.vehicleType ?? '')
      setEditVehiclePlate(agent.vehiclePlate ?? '')
      setEditMaxOrders(agent.maxConcurrentOrders?.toString() ?? '')
      setEditIsActive(agent.isActive)
    }
  }, [agent])

  const handleLogout = async () => {
    try {
      await logout()
    } catch {}
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading agent…</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Card>
          <CardHeader>
            <CardTitle>Agent not found</CardTitle>
          </CardHeader>
          <CardContent>No agent with this ID exists.</CardContent>
          <CardFooter>
            <Link to="/admin/agents">
              <Button>Back to agents</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const input: UpdateAgentInput = {}
    if (editVehicleType) input.vehicleType = editVehicleType
    if (editVehiclePlate) input.vehiclePlate = editVehiclePlate
    if (editMaxOrders !== '') input.maxConcurrentOrders = Number(editMaxOrders)
    input.isActive = editIsActive
    updateMutation.mutate(input)
  }

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/admin/agents">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="mr-1 size-4" /> Back to agents
                </Button>
              </Link>
              <Sheet>
                <SheetTrigger>
                  <Button variant="outline" size="sm">
                    <Edit2 className="mr-1 size-4" /> Edit agent
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[420px]">
                  <SheetHeader>
                    <SheetTitle>Edit Agent</SheetTitle>
                  </SheetHeader>
                  <form onSubmit={handleEditSubmit} className="space-y-4 p-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-vehicle-type">Vehicle type</Label>
                      <Input
                        id="edit-vehicle-type"
                        type="text"
                        list="vehicle-options"
                        placeholder="bike / scooter / car / van"
                        value={editVehicleType}
                        onChange={(e) =>
                          setEditVehicleType(e.target.value as VehicleType)
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
                      <Label htmlFor="edit-vehicle-plate">Vehicle plate</Label>
                      <Input
                        id="edit-vehicle-plate"
                        type="text"
                        placeholder="BA 12 PA 3456"
                        value={editVehiclePlate}
                        onChange={(e) => setEditVehiclePlate(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-max-orders">Max concurrent orders</Label>
                      <Input
                        id="edit-max-orders"
                        type="number"
                        min={1}
                        max={10}
                        placeholder="e.g. 2"
                        value={editMaxOrders}
                        onChange={(e) => setEditMaxOrders(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Label htmlFor="edit-is-active">Active</Label>
                      <input
                        id="edit-is-active"
                        type="checkbox"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        disabled={isPending}
                      />
                    </div>
                    <Button type="submit" disabled={isPending} className="w-full">
                      {saveLabel}
                    </Button>
                  </form>
                </SheetContent>
              </Sheet>
              <Button
                onClick={() => {
                  updateMutation.mutate({ isActive: false })
                }}
                disabled={isPending}
                variant="destructive"
                size="sm"
              >
                <>
                  <Trash2 className="mr-1 size-4" /> {deactivateLabel}
                </>
              </Button>
              <Dialog>
  <DialogTrigger>
    <Button
      variant="destructive"
      size="sm"
      onClick={() => {
        if (
          window.confirm(
            'Are you sure you want to deactivate this agent?'
          )
        ) {
          updateMutation.mutate({ isActive: false })
        }
      }}
      disabled={isPending}
    >
      <Trash2 className="mr-1 size-4" /> {deactivateLabel}
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle>Deactivate Agent</DialogTitle>
    <DialogFooter>
      <Button onClick={() => { updateMutation.mutate({ isActive: false }) }}>Deactivate</Button>
      <Button variant="outline">Cancel</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={agent.user?.avatar || undefined}
                  alt={agent.user?.name}
                />
                <AvatarFallback>
                  {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
                  {agent.user?.name?.charAt(0).toUpperCase() ||
                  agent.userId.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Sign out
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <CardDescription>
                  {agent.status.charAt(0).toUpperCase() +
                  agent.status.slice(1)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="outline" className={statusVariant(agent.status)}>
                  {agent.status}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Online</CardTitle>
                <CardDescription>{agent.isOnline ? 'Yes' : 'No'}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge
                  variant={agent.isOnline ? 'default' : 'secondary'}
                  className="h-6 w-6 px-1.5 py-0 text-[10px]"
                >
                  {agent.isOnline ? '●' : '○'}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Vehicle</CardTitle>
                <CardDescription>
                  {agent.vehicleType ||
                  agent.vehiclePlate ? `${agent.vehicleType} · ${agent.vehiclePlate}` : '—'}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Max Orders</CardTitle>
                <CardDescription>{agent.maxConcurrentOrders ?? '—'}</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Update Agent Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-status">New status</Label>
                  <Input
                    id="new-status"
                    type="text"
                    list="status-options"
                    placeholder="available / busy / break / offline / suspended"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={isPending}
                  />
                  <datalist id="status-options">
                    <option value="available" />
                    <option value="busy" />
                    <option value="break" />
                    <option value="offline" />
                    <option value="suspended" />
                  </datalist>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Label htmlFor="toggle-online">Mark online</Label>
                  <input
                    id="toggle-online"
                    type="checkbox"
                    checked={agent.isOnline}
                    onChange={() => {
                      updateMutation.mutate({
                        isOnline: !agent.isOnline,
                      })
                    }}
                    disabled={isPending}
                  />
                </div>

                <Button
                  onClick={() => {
                    if (!status) return
                    updateMutation.mutate({ status: status as AgentStatus })
                    setStatus('')
                  }}
                  disabled={isPending}
                  className="w-full"
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
                  {updateMutation.isPending ? 'Updating…' : 'Update Status'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <User className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{agent.user?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.user?.email || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="size-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{agent.userId}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Joined {new Date(agent.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Battery className="size-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {agent.currentOrderId ? 'Active order' : 'No active order'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      </AdminLayout>
  )
}
