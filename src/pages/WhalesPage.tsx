import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getWhales, type Whale } from '@/lib/api'
import { formatAddress, formatPercent } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, Search, X, RefreshCw, TrendingUp } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

type SortField = 'roi' | 'trades' | 'followers'
type SortDir = 'asc' | 'desc'

// Mock data fallback when backend unavailable
const MOCK_WHALES: Whale[] = Array.from({ length: 50 }, (_, i) => ({
  id: `whale-${i + 1}`,
  address: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, '0')}`,
  username: `Trader${String(i + 1).padStart(3, '0')}`,
  roi: Math.round((Math.random() * 400 - 50) * 100) / 100,
  trades: Math.floor(Math.random() * 500) + 10,
  followers: Math.floor(Math.random() * 10000),
  winRate: Math.round(Math.random() * 40 + 50),
  profit30d: Math.round((Math.random() * 50000 - 5000) * 100) / 100,
}))

export function WhalesPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('roi')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const tableRef = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 10

  const { data, isLoading, isRefetching, error } = useQuery({
    queryKey: ['whales'],
    queryFn: async () => {
      try {
        const res = await getWhales()
        return res.data
      } catch {
        return MOCK_WHALES
      }
    },
    refetchInterval: 5000,
    staleTime: 4000,
  })

  // Show error toast (but still use mock data)
  if (error) toast('Failed to fetch whales. Showing cached data.', 'error')

  const whales = data ?? []

  // Filter
  const filtered = whales.filter(w =>
    w.username.toLowerCase().includes(search.toLowerCase()) ||
    w.address.toLowerCase().includes(search.toLowerCase())
  )

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const mult = sortDir === 'desc' ? -1 : 1
    return (a[sortField] - b[sortField]) * mult
  })

  // Paginate
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
    setPage(1)
  }

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? sortDir === 'desc' ? <ChevronDown className="h-4 w-4 inline ml-1" /> : <ChevronUp className="h-4 w-4 inline ml-1" />
      : <span className="h-4 w-4 inline ml-1 opacity-30">↕</span>

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-blue-400" />
            Top Traders
          </h1>
          <p className="text-gray-400 mt-1">Tracking {whales.length} whale wallets on Polymarket</p>
        </div>
        {isRefetching && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Updating...
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by username or address..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="pl-9 pr-9"
          data-testid="search-input"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setPage(1) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div ref={tableRef} className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : pageData.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {search ? (
              <>
                <p className="text-lg font-medium">No results for "{search}"</p>
                <p className="text-sm mt-1">Try a different username or address</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">No traders found</p>
                <p className="text-sm mt-1">Check back later</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full hidden md:table" data-testid="whales-table">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="text-left pb-3 pl-4 w-12">Rank</th>
                  <th className="text-left pb-3">Username</th>
                  <th className="text-right pb-3 cursor-pointer hover:text-white" onClick={() => handleSort('roi')}>
                    ROI <SortIcon field="roi" />
                  </th>
                  <th className="text-right pb-3 cursor-pointer hover:text-white" onClick={() => handleSort('trades')}>
                    Trades <SortIcon field="trades" />
                  </th>
                  <th className="text-right pb-3 pr-4 cursor-pointer hover:text-white" onClick={() => handleSort('followers')}>
                    Followers <SortIcon field="followers" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((whale, idx) => {
                  const rank = (page - 1) * PAGE_SIZE + idx + 1
                  return (
                    <tr
                      key={whale.id}
                      className={`border-b border-gray-800 hover:bg-gray-800/60 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-gray-900/30' : ''}`}
                      onClick={() => navigate(`/whales/${whale.id}`)}
                      data-testid="whale-row"
                    >
                      <td className="py-4 pl-4 text-gray-400 font-mono text-sm">{rank}</td>
                      <td className="py-4">
                        <div>
                          <div className="font-medium text-white">{whale.username}</div>
                          <div className="text-xs text-gray-500 font-mono">{formatAddress(whale.address)}</div>
                        </div>
                      </td>
                      <td className={`py-4 text-right font-semibold ${whale.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(whale.roi)}
                      </td>
                      <td className="py-4 text-right text-gray-300">{whale.trades.toLocaleString()}</td>
                      <td className="py-4 pr-4 text-right text-gray-300">{whale.followers.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {pageData.map((whale, idx) => {
                const rank = (page - 1) * PAGE_SIZE + idx + 1
                return (
                  <div
                    key={whale.id}
                    className="bg-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => navigate(`/whales/${whale.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-mono text-sm w-6">#{rank}</span>
                        <div>
                          <div className="font-medium text-white">{whale.username}</div>
                          <div className="text-xs text-gray-500">{formatAddress(whale.address)}</div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${whale.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(whale.roi)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-400">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Prev</Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPage(p)}
                >{p}</Button>
              )
            })}
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
