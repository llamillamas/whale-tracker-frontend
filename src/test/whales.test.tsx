import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/ui/toast'

const mockWhales = Array.from({ length: 20 }, (_, i) => ({
  id: `whale-${i + 1}`,
  address: `0x${'a'.repeat(40)}`,
  username: `Trader${String(i + 1).padStart(3, '0')}`,
  roi: (i % 5 === 0 ? -20 : 30) + i * 10,
  trades: 100 + i * 10,
  followers: 500 + i * 100,
}))

const mockTrades = Array.from({ length: 10 }, (_, i) => ({
  id: `t-${i}`, date: new Date().toISOString(),
  market: `Market ${i + 1}`, marketId: `mkt-${i + 1}`,
  side: (i % 2 === 0 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
  price: 0.5, amount: 100, pnl: 50, fee: 1,
}))

vi.mock('@/lib/api', () => ({
  getWhales: vi.fn().mockResolvedValue({ data: mockWhales }),
  getWhale: vi.fn().mockResolvedValue({
    data: { id: 'whale-1', address: '0x' + 'a'.repeat(40), username: 'Trader001', roi: 150.5, trades: 342, followers: 1284, winRate: 68.5, profit30d: 42300 },
  }),
  getWhaleTrades: vi.fn().mockResolvedValue({ data: { trades: mockTrades, total: 10 } }),
  getWhalePnL: vi.fn().mockResolvedValue({
    data: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
      pnl: i * 100,
    })),
  }),
  api: { interceptors: { request: { use: vi.fn() } } },
}))

function makeWrapper(path = '/whales') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })
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

describe('Task 1.6: Leaderboard', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('Test 1: Leaderboard page loads and shows traders', async () => {
    const { WhalesPage } = await import('@/pages/WhalesPage')
    const Wrapper = makeWrapper()
    render(<Wrapper><Routes><Route path="/whales" element={<WhalesPage />} /></Routes></Wrapper>)
    await waitFor(() => expect(screen.getByText(/Top Traders/i)).toBeInTheDocument(), { timeout: 5000 })
    // After data loads, rows appear
    await waitFor(() => expect(screen.getAllByTestId('whale-row').length).toBeGreaterThan(0), { timeout: 5000 })
  })

  it('Test 2: Search filters whales by username', async () => {
    const { WhalesPage } = await import('@/pages/WhalesPage')
    const Wrapper = makeWrapper()
    render(<Wrapper><Routes><Route path="/whales" element={<WhalesPage />} /></Routes></Wrapper>)
    await waitFor(() => expect(screen.getAllByTestId('whale-row').length).toBeGreaterThan(0), { timeout: 5000 })

    const input = screen.getByTestId('search-input')
    fireEvent.change(input, { target: { value: 'Trader001' } })

    await waitFor(() => {
      const rows = screen.getAllByTestId('whale-row')
      expect(rows).toHaveLength(1)
    })
  })

  it('Test 3: Click whale row navigates to profile page', async () => {
    const { WhalesPage } = await import('@/pages/WhalesPage')
    const Wrapper = makeWrapper()
    render(
      <Wrapper>
        <Routes>
          <Route path="/whales" element={<WhalesPage />} />
          <Route path="/whales/:id" element={<div data-testid="profile-page">Profile</div>} />
        </Routes>
      </Wrapper>
    )
    await waitFor(() => expect(screen.getAllByTestId('whale-row').length).toBeGreaterThan(0), { timeout: 5000 })
    fireEvent.click(screen.getAllByTestId('whale-row')[0])
    await waitFor(() => expect(screen.getByTestId('profile-page')).toBeInTheDocument(), { timeout: 3000 })
  })
})

describe('Task 1.7: Whale Profiles', () => {
  it('Test 1: Profile page loads with all stats', async () => {
    const { WhaleProfilePage } = await import('@/pages/WhaleProfilePage')
    const Wrapper = makeWrapper('/whales/whale-1')
    render(
      <Wrapper>
        <Routes>
          <Route path="/whales/:id" element={<WhaleProfilePage />} />
        </Routes>
      </Wrapper>
    )
    // The follow button is always rendered once loading is done (not conditional on whale data)
    // Use a longer timeout since this is the first dynamic import
    await waitFor(() => {
      const el = screen.queryByTestId('follow-btn') || screen.queryByText(/30-Day P&L/i) || screen.queryByText(/ROI/i)
      expect(el).not.toBeNull()
    }, { timeout: 15000 })

    // Stats section should be visible
    expect(screen.getByText(/30-Day P&L/i)).toBeInTheDocument()
  }, 20000)

  it('Test 2: Chart and trading history table render', async () => {
    const { WhaleProfilePage } = await import('@/pages/WhaleProfilePage')
    const Wrapper = makeWrapper('/whales/whale-1')
    render(
      <Wrapper>
        <Routes>
          <Route path="/whales/:id" element={<WhaleProfilePage />} />
        </Routes>
      </Wrapper>
    )
    await waitFor(() => expect(screen.getByText('30-Day P&L')).toBeInTheDocument(), { timeout: 5000 })
    expect(screen.getByText('Recent Trades')).toBeInTheDocument()
  })
})
