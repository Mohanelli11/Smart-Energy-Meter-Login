import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import { AuthProvider } from '../features/authentication'

/** Render a tree inside a router + AuthProvider, starting at the given URL. */
export function renderWithAuth(ui: ReactElement, route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  )
}
