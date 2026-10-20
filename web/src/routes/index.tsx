import { ModeToggle } from '@/components/mode-toggle'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

const fetchPosts = createServerFn({ method: 'GET' }).handler(async () => {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts')
  if (!res.ok) throw new Error('Failed to fetch posts')

  const data = await res.json()
  return data.slice(0, 5)
})

const postsQueryOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: () => fetchPosts(),
})

export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    await context.queryClient.query(postsQueryOptions)
  },
  component: Home,
})
function Home() {
  const { data: posts } = useSuspenseQuery(postsQueryOptions)

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary">Dashboard</Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Latest posts
            </h1>
            <p className="text-muted-foreground">
              Stay up to date with the latest published content.
            </p>
          </div>
          <ModeToggle />
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recent updates</CardTitle>
            <CardDescription>
              A curated selection of the newest posts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {posts.map((post: { id: number; title: string }) => (
                <article
                  key={post.id}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-6">
                      {post.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Read the latest update from our team.
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    #{post.id}
                  </Badge>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
