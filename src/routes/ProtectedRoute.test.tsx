import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '../features/authentication'
import { renderWithAuth } from '../test/renderWithAuth'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('../features/authentication/services/auth.service', () => ({
  restoreSession: vi.fn(),
  login: vi.fn(),
  meterLogin: vi.fn(),
  logout: vi.fn(),
}))

import * as authService from '../features/authentication/services/auth.service'

const staff = (role: Role) => ({ id: '1', email: 'a@example.com', name: 'A', role })
const meter = { accountNo: 'MET-1000-2023', meterNo: 'ESP-1000-001', customerName: 'John', location: 'Ruiru', type: 'prepaid', consumption: '1', balance: '2', status: 'Active' }

function renderApp(route: string, element: React.ReactElement) {
  return renderWithAuth(
    <Routes>
      <Route path="/login" element={<div>login page</div>} />
      <Route path="/meter-login" element={<div>meter login page</div>} />
      <Route path="/secret" element={element} />
    </Routes>,
    route
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects anonymous visitors to /login', async () => {
    vi.mocked(authService.restoreSession).mockResolvedValue({ user: null, meter: null })
    renderApp('/secret', <ProtectedRoute><div>secret content</div></ProtectedRoute>)
    expect(await screen.findByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('secret content')).not.toBeInTheDocument()
  })

  it('shows a loading state while the session is being checked', () => {
    vi.mocked(authService.restoreSession).mockReturnValue(new Promise(() => undefined))
    renderApp('/secret', <ProtectedRoute><div>secret content</div></ProtectedRoute>)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('secret content')).not.toBeInTheDocument()
  })

  it('renders content for a signed-in staff member', async () => {
    vi.mocked(authService.restoreSession).mockResolvedValue({ user: staff(Role.ENGINEER), meter: null })
    renderApp('/secret', <ProtectedRoute><div>secret content</div></ProtectedRoute>)
    expect(await screen.findByText('secret content')).toBeInTheDocument()
  })

  it('blocks roles that are not allowed', async () => {
    vi.mocked(authService.restoreSession).mockResolvedValue({ user: staff(Role.FINANCE), meter: null })
    renderApp('/secret', <ProtectedRoute roles={[Role.SUPER_ADMIN, Role.UTILITY_ADMIN]}><div>admin only</div></ProtectedRoute>)
    expect(await screen.findByText(/access denied/i)).toBeInTheDocument()
    expect(screen.queryByText('admin only')).not.toBeInTheDocument()
  })

  it('allows an allowed role', async () => {
    vi.mocked(authService.restoreSession).mockResolvedValue({ user: staff(Role.UTILITY_ADMIN), meter: null })
    renderApp('/secret', <ProtectedRoute roles={[Role.SUPER_ADMIN, Role.UTILITY_ADMIN]}><div>admin only</div></ProtectedRoute>)
    expect(await screen.findByText('admin only')).toBeInTheDocument()
  })

  it('keeps staff and meter sessions separate', async () => {
    // A staff session must not satisfy a meter-only route...
    vi.mocked(authService.restoreSession).mockResolvedValue({ user: staff(Role.SUPER_ADMIN), meter: null })
    renderApp('/secret', <ProtectedRoute kind="meter"><div>meter content</div></ProtectedRoute>)
    expect(await screen.findByText('meter login page')).toBeInTheDocument()
  })

  it('lets a meter session reach a meter route', async () => {
    vi.mocked(authService.restoreSession).mockResolvedValue({ user: null, meter: meter as never })
    renderApp('/secret', <ProtectedRoute kind="meter"><div>meter content</div></ProtectedRoute>)
    expect(await screen.findByText('meter content')).toBeInTheDocument()
  })
})
