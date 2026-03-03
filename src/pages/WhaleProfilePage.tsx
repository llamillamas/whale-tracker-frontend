import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getWhale, getWhaleTrades, getWhalePnL, type Trade, type PnLPoint } from '@/lib/api'
import { formatAddress, formatCurrency, formatPercent } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, TrendingUp, Users, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// Mock data generators
const mockPnL = (): PnLPoint[] => {
  let running = 0
  return Array.from({ length: 30 }, (_, i) => {
    running += Math.round((Math.random() * 2000 - 800) * 100) / 100
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return { date: d.toISOString().slice(0, 10), pnl: running }
  })
}

const mockTrades = (whaleId: string): Trade[] =>
  Array.from({ length: 20 }, (_, i) => ({
    id: `trade-${i}`,
    date: new Date(Date.now() - i * 3600000 * 12).toISOString(),
    market: `Market Question ${i + 1} - Will X happen?`,
    marketId: `market-${i + 1}`,
    side: (i % 2 === 0 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
    price: Math.round(Math.random() * 80 + 10) / 100,
    amount: Math.floor(Math.random() * 500) + 10,
    pnl: Math.round((Math.random() * 2000 - 500) * 100) / 100,
    fee: Math.round(Math.random() * 5 * 100) / 100,
  }))

export function WhaleProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tradePage, setTradePage] = useState(1)
  const [selectedMarket, setSelectedMarket] = useState<Trade | null>(null)
  const [following, setFollowing] = useState(false)
  const PAGE_SIZE = 10

  const { data: whale, isLoading: whaleLoading } = useQuery({
    queryKey: ['whale', id],
    queryFn: async () => {
      try {
        const res = await getWhale(id!)
        return res.data
      } catch {
        return {
          id: id!,
          address: id!.startsWith('0x') ? id! : `0x${id}${'0'.repeat(36)}`.slice(0, 42),
          username: `Trader_${id?.slice(-6) ?? 'Unknown'}`,
          roi: 127.4,
          trades: 342,
          followers: 1284,
          winRate: 68.5,
          profit30d: 42300,
        }
      }
    },
    enabled: !!id,
  })

  const { data: pnlData } = useQuery({
    queryKey: ['whale-pnl', id],
    queryFn: async () => {
      try {
        const res = await getWhalePnL(id!)
        return res.data
      } catch {
        return mockPnL()
      }
    },
    enabled: !!id,
  })

  const { data: tradesData } = useQuery({
    queryKey: ['whale-trades', id, tradePage],
    queryFn: async () => {
      try {
        const res = await getWhaleTrades(id!, tradePage)
        return res.data
      } catch {
        return { trades: mockTrades(id!), total: 20 }
      }
    },
    enabled: !!id,
  })

  if (whaleLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
          <div className="h-32 bg-gray-800 rounded animate-pulse" />
          <div className="h-64 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  const trades = tradesData?.trades ?? []
  const totalTrades = tradesData?.total ?? 0
  const totalPages = Math.ceil(totalTrades / PAGE_SIZE)

  const lastPnL = pnlData?.[pnlData.length - 1]?.pnl ?? 0
  const chartColor = lastPnL >= 0 ? '#4ade80' : '#f87171'

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate('/whales')} className="mb-6 text-gray-400">
        <ArrowLeft className="h-4 w-4" />
        Back to Whales
      </Button>

      {/* Profile header */}
      {whale && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {whale.username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{whale.username}</h1>
              <div className="text-sm text-gray-400 font-mono">{formatAddress(whale.address)}</div>
            </div>
          </div>
          <Button
            variant={following ? 'secondary' : 'default'}
            onClick={() => setFollowing(!following)}
            data-testid="follow-btn"
          >
            {following ? 'Unfollow' : 'Follow'}
          </Button>
        </div>
      )}

      {/* Stats cards */}
      {whale && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" />ROI</div>
              <div className={`text-xl font-bold ${whale.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatPercent(whale.roi)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-gray-400 mb-1">Win Rate</div>
              <div className="text-xl font-bold text-white">{whale.winRate?.toFixed(1) ?? '—'}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1"><BarChart2 className="h-3 w-3" />Trades</div>
              <div className="text-xl font-bold text-white">{whale.trades.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Users className="h-3 w-3" />Followers</div>
              <div className="text-xl font-bold text-white">{whale.followers.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-gray-400 mb-1">30d Profit</div>
              <div className={`text-xl font-bold ${(whale.profit30d ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(whale.profit30d ?? 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart + Trades layout */}
      <div className="grid md:grid-cols-5 gap-6">
        {/* P&L Chart (60% width) */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>30-Day P&L</CardTitle>
            </CardHeader>
            <CardContent>
              {pnlData && pnlData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280} data-testid="pnl-chart">
                  <LineChart data={pnlData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      tickFormatter={d => d.slice(5)}
                    />
                    <YAxis
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#d1d5db' }}
                      formatter={(v: number) => [formatCurrency(v), 'P&L']}
                    />
                    <Line
                      type="monotone"
                      dataKey="pnl"
                      stroke={chartColor}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">No chart data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trading history */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto" data-testid="trades-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-xs">
                      <th className="text-left py-2 px-4">Market</th>
                      <th className="text-center py-2">Side</th>
                      <th className="text-right py-2 pr-4">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(trade => (
                      <tr
                        key={trade.id}
                        className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                        onClick={() => setSelectedMarket(trade)}
                      >
                        <td className="py-2 px-4">
                          <div className="text-gray-300 truncate max-w-[120px] text-xs">{trade.market}</div>
                          <div className="text-gray-500 text-xs">{new Date(trade.date).toLocaleDateString()}</div>
                        </td>
                        <td className="py-2 text-center">
                          <Badge variant={trade.side === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                            {trade.side}
                          </Badge>
                        </td>
                        <td className={`py-2 pr-4 text-right text-xs font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(trade.pnl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-2 p-4">
                {trades.map(trade => (
                  <div
                    key={trade.id}
                    className="bg-gray-800 rounded-lg p-3 cursor-pointer"
                    onClick={() => setSelectedMarket(trade)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={trade.side === 'BUY' ? 'default' : 'destructive'}>{trade.side}</Badge>
                      <span className={`font-semibold text-sm ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(trade.pnl)}</span>
                    </div>
                    <div className="text-xs text-gray-400 truncate">{trade.market}</div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-700">
                  <Button variant="ghost" size="icon" onClick={() => setTradePage(p => p - 1)} disabled={tradePage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-400">{tradePage}/{totalPages}</span>
                  <Button variant="ghost" size="icon" onClick={() => setTradePage(p => p + 1)} disabled={tradePage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Market detail modal */}
      <Modal
        open={!!selectedMarket}
        onClose={() => setSelectedMarket(null)}
        title="Trade Details"
      >
        {selectedMarket && (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Market</div>
              <div className="text-white">{selectedMarket.market}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Side</div>
                <Badge variant={selectedMarket.side === 'BUY' ? 'default' : 'destructive'}>{selectedMarket.side}</Badge>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Date</div>
                <div className="text-white text-sm">{new Date(selectedMarket.date).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Price</div>
                <div className="text-white">{(selectedMarket.price * 100).toFixed(1)}¢</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Amount</div>
                <div className="text-white">{selectedMarket.amount} shares</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Fee</div>
                <div className="text-white">{formatCurrency(selectedMarket.fee ?? 0)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">P&L</div>
                <div className={`font-semibold ${selectedMarket.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(selectedMarket.pnl)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
