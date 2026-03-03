import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/ui/toast'
import { ProtectedRoute } from '@/components/ProtectedRoute'

vi.mock('@/lib/api', () => ({
  authLogin: vi.fn().mockResolvedValue({ data: { user: { address: '0xTest', username: 'Test' }, token: 'mock-token' } }),
  api: { interceptors: { request: { use: vi.fn() } } },
}))

function makeWrapper(path = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={[path]}>
              {children}
            </MemoryRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    )
  }
}

describe('Task 1.5: Auth UI', () => {
  beforeEach(() => { localStorage.clear() })

  it('Test 1: Login page renders connect wallet button', async () => {
    const { LoginPage } = await import('@/pages/LoginPage')
    const Wrapper = makeWrapper('/login')
    render(
      <Wrapper>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Wrapper>
    )
    await waitFor(() => expect(screen.getAllByText(/Whale Tracker/i).length).toBeGreaterThan(0))
    expect(screen.getByText(/Connect MetaMask/i)).toBeInTheDocument()
  })

  it('Test 2: Protected route redirects to /login when not logged in', async () => {
    const Wrapper = makeWrapper('/dashboard')
    render(
      <Wrapper>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><div data-testid="dashboard">Dashboard</div></ProtectedRoute>}
          />
        </Routes>
      </Wrapper>
    )
    await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument())
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument()
  })

  it('Test 3: Logout clears token and auth state', async () => {
    localStorage.setItem('whale_token', 'tok')
    localStorage.setItem('whale_user', JSON.stringify({ address: '0xABC', username: 'Alice' }))

    function LogoutTester() {
      const { logout, isLoggedIn } = useAuth()
      return (
        <>
          <span data-testid="status">{isLoggedIn ? 'in' : 'out'}</span>
          <button data-testid="logout" onClick={logout}>Logout</button>
        </>
      )
    }

    const Wrapper = makeWrapper()
    render(<Wrapper><LogoutTester /></Wrapper>)

    expect(screen.getByTestId('status').textContent).toBe('in')
    fireEvent.click(screen.getByTestId('logout'))

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('out')
      expect(localStorage.getItem('whale_token')).toBeNull()
    })
  })
})
