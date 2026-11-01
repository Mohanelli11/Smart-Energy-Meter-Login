import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../services/api/client'
import { renderWithAuth } from '../test/renderWithAuth'
import { LoginForm } from './LoginForm'

vi.mock('../features/authentication/services/auth.service', () => ({
  restoreSession: vi.fn().mockResolvedValue({ user: null, meter: null }),
  login: vi.fn(),
  meterLogin: vi.fn(),
  logout: vi.fn(),
}))

import * as authService from '../features/authentication/services/auth.service'

const user = { id: '1', email: 'admin@example.com', name: 'Admin', role: 'SUPER_ADMIN' }

async function fill(email: string, password: string) {
  const ui = userEvent.setup()
  await ui.type(screen.getByLabelText(/email address/i), email)
  await ui.type(screen.getByLabelText(/^password$/i), password)
  return ui
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.restoreSession).mockResolvedValue({ user: null, meter: null })
  })

  it('has labelled fields and a working show/hide password toggle', async () => {
    renderWithAuth(<LoginForm />)
    const password = screen.getByLabelText(/^password$/i)
    expect(password).toHaveAttribute('type', 'password')
    await userEvent.setup().click(screen.getByRole('button', { name: /show password/i }))
    expect(password).toHaveAttribute('type', 'text')
  })

  it('does not call the API for an invalid email', async () => {
    renderWithAuth(<LoginForm />)
    const ui = await fill('not-an-email', 'whatever-password')
    await ui.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
    expect(authService.login).not.toHaveBeenCalled()
  })

  it('sends credentials and the remember flag to the server and reports success', async () => {
    vi.mocked(authService.login).mockResolvedValue(user as never)
    const onSuccess = vi.fn()
    renderWithAuth(<LoginForm onSuccess={onSuccess} />)
    const ui = await fill('admin@example.com', 'Correct-Horse-9!')
    await ui.click(screen.getByLabelText(/keep me signed in/i))
    await ui.click(screen.getByRole('button', { name: /^sign in$/i }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(authService.login).toHaveBeenCalledWith('admin@example.com', 'Correct-Horse-9!', true)
  })

  it('shows the server\'s generic error and keeps the form usable', async () => {
    vi.mocked(authService.login).mockRejectedValue(new ApiError(401, 'invalid_credentials', 'Invalid credentials. Please check your details and try again.'))
    renderWithAuth(<LoginForm />)
    const ui = await fill('admin@example.com', 'wrong-password-1')
    await ui.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeEnabled()
  })

  it('disables the form when the server reports the account is locked', async () => {
    vi.mocked(authService.login).mockRejectedValue(new ApiError(429, 'locked', 'Too many failed attempts. Try again in 15 minutes.', 900))
    renderWithAuth(<LoginForm />)
    const ui = await fill('admin@example.com', 'wrong-password-1')
    await ui.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText(/temporarily locked/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /account locked/i })).toBeDisabled()
  })

  it('never keeps credentials or tokens in browser storage', async () => {
    vi.mocked(authService.login).mockResolvedValue(user as never)
    renderWithAuth(<LoginForm />)
    const ui = await fill('admin@example.com', 'Correct-Horse-9!')
    await ui.click(screen.getByRole('button', { name: /^sign in$/i }))
    await waitFor(() => expect(authService.login).toHaveBeenCalled())
    expect(JSON.stringify({ ...localStorage })).not.toMatch(/Correct-Horse|token|password/i)
    expect(JSON.stringify({ ...sessionStorage })).not.toMatch(/Correct-Horse|token|password/i)
  })
})
