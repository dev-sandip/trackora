import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '#/components/theme-provider'

// export const Route = createRootRoute({
//   head: () => ({
//     meta: [
//       {
//         charSet: 'utf-8',
//       },
//       {
//         name: 'viewport',
//         content: 'width=device-width, initial-scale=1',
//       },
//       {
//         title: 'TanStack Start Starter',
//       },
//     ],
//     links: [
//       {
//         rel: 'stylesheet',
//         href: appCss,
//       },
//     ],
//   }),
//   shellComponent: RootDocument,
// })
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})
function RootDocument({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext()
  return (
    <QueryClientProvider client={queryClient}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <HeadContent />
        </head>
        <body>
          <ThemeProvider defaultTheme="system" storageKey="theme">
            {children}
          </ThemeProvider>

          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
          <Scripts />
        </body>
      </html>
    </QueryClientProvider>
  )
}
