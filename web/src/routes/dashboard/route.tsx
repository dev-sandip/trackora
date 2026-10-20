import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '../../auth/auth-context'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user, logout, logoutAll, isLoggingOut } = useAuth()

  return (
    <main style={{ maxWidth: 640, margin: '48px auto', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 4 }}>Dashboard</h1>
      <p style={{ color: '#64748b' }}>
        This route is protected by the <code>_protected</code> layout.
      </p>

      {user ? (
        <ul>
          <li>Name: {user.name}</li>
          <li>Email: {user.email}</li>
          <li>
            Role: <code>{user.role}</code>
          </li>
          <li>
            Active: <code>{String(user.isActive)}</code>
          </li>
        </ul>
      ) : null}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          onClick={() => void logout()}
          disabled={isLoggingOut}
          style={buttonStyle}
        >
          {isLoggingOut ? 'Signing out…' : 'Sign out'}
        </button>
        <button
          onClick={() => void logoutAll()}
          disabled={isLoggingOut}
          style={buttonStyle}
        >
          Sign out of all devices
        </button>
      </div>
    </main>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: 14,
  fontWeight: 600,
  color: '#fff',
  background: '#0f172a',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
}
