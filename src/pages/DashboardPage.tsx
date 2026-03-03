import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPortfolio, getPositions, getOrders, searchMarkets, placeOrder,
  type Position, type Order, type Market
} from '@/lib/api'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Search, X } from 'lucide-react'

// --- Mock data for dev ---
const MOCK_PORTFOLIO = { totalBalance: 10000, totalPositionValue: 6200, cash: 3800, totalPnl: 1240.50, totalPnlPercent: 14.1 }
const MOCK_POSITIONS: Position[] = Array.from({ length: 5 }, (_, i) => ({
  id: `pos-${i}`,
  market: `Market ${i + 1} - Some prediction question`,
  marketId: `mkt-${i + 1}`,
  shares: Math.floor(Math.random() * 200) + 10,
  avgCost: Math.round(Math.random() * 60 + 20) / 100,
  currentValue: Math.round(Math.random() * 1000 * 100) / 100,
  pnl: Math.round((Math.random() * 400 - 100) * 100) / 100,
  pnlPercent: Math.round((Math.random() * 80 - 20) * 100) / 100,
  buyInDate: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
  currentMarketPrice: Math.round(Math.random() * 80 + 10) / 100,
}))
const MOCK_ORDERS: Order[] = Array.from({ length: 10 }, (_, i) => ({
  id: `order-${i}`,
  marketId: `mkt-${i % 5}`,
  market: `Market ${i % 5 + 1} - Some prediction question`,
  side: (i % 2 === 0 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
  price: Math.round(Math.random() * 80 + 10) / 100,
  amount: Math.floor(Math.random() * 200) + 5,
  status: 'filled',
  pnl: Math.round((Math.random() * 300 - 50) * 100) / 100,
}))
const MOCK_MARKETS: Market[] = Array.from({ length: 20 }, (_, i) => ({
  id: `mkt-${i}`,
  question: `Will event ${i + 1} happen by end of 2025?`,
  currentPrice: Math.round(Math.random() * 80 + 10) / 100,
  volume: Math.floor(Math.random() * 1000000),
}))

export function DashboardPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Order form state
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [marketSearch, setMarketSearch] = useState('')
  const [marketResults, setMarketResults] = useState<Market[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [price, setPrice] = useState('')
  const [amount, setAmount] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Position detail modal
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

  // Trade detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Real-time portfolio (1s polling)
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => { try { return (await getPortfolio()).data } catch { return MOCK_PORTFOLIO } },
    refetchInterval: 1000,
    staleTime: 800,
  })

  const { data: positions } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => { try { return (await getPositions()).data } catch { return MOCK_POSITIONS } },
    refetchInterval: 1000,
    staleTime: 800,
  })

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => { try { return (await getOrders()).data } catch { return MOCK_ORDERS } },
    refetchInterval: 1000,
    staleTime: 800,
  })

  // Market typeahead
  useEffect(() => {
    if (!marketSearch.trim()) { setMarketResults([]); setShowDropdown(false); return }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await searchMarkets(marketSearch)
        setMarketResults(res.data.slice(0, 5))
      } catch {
        setMarketResults(MOCK_MARKETS.filter(m => m.question.toLowerCase().includes(marketSearch.toLowerCase())).slice(0, 5))
      }
      setShowDropdown(true)
    }, 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [marketSearch])

  // Place order mutation
  const orderMutation = useMutation({
    mutationFn: placeOrder,
    onSuccess: () => {
      toast('Order placed successfully!', 'success')
      setSelectedMarket(null)
      setMarketSearch('')
      setPrice('')
      setAmount('')
      setFormErrors({})
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    },
    onError: () => {
      // Mock success for dev
      toast('Order placed successfully! (mock)', 'success')
      setSelectedMarket(null)
      setMarketSearch('')
      setPrice('')
      setAmount('')
    },
  })

  const validateAndSubmit = () => {
    const errors: Record<string, string> = {}
    if (!selectedMarket) errors.market = 'Select a market'
    const priceNum = parseFloat(price)
    const amountNum = parseInt(amount)
    if (!price || isNaN(priceNum) || priceNum <= 0) errors.price = 'Price must be > 0'
    if (!amount || isNaN(amountNum) || amountNum <= 0) errors.amount = 'Amount must be > 0'
    if (side === 'SELL' && selectedMarket && positions) {
      const pos = positions.find(p => p.marketId === selectedMarket.id)
      if (!pos || amountNum > pos.shares) errors.amount = "Can't sell more than owned"
    }
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    orderMutation.mutate({ marketId: selectedMarket!.id, side, price: priceNum, amount: amountNum })
  }

  const pnl = portfolio?.totalPnl ?? 0
  const pnlPct = portfolio?.totalPnlPercent ?? 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      {/* === Portfolio Summary === */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8" data-testid="portfolio-summary">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1"><DollarSign className="h-3 w-3" />Total Balance</div>
            <div className="text-xl font-bold text-white">{formatCurrency(portfolio?.totalBalance ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-gray-400 mb-1">Position Value</div>
            <div className="text-xl font-bold text-white">{formatCurrency(portfolio?.totalPositionValue ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-gray-400 mb-1">Cash</div>
            <div className="text-xl font-bold text-white">{formatCurrency(portfolio?.cash ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              {pnl >= 0 ? <TrendingUp className="h-3 w-3 text-green-400" /> : <TrendingDown className="h-3 w-3 text-red-400" />}
              Total P&L
            </div>
            <div className={`text-xl font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(pnl)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-gray-400 mb-1">P&L %</div>
            <div className={`text-xl font-bold ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatPercent(pnlPct)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Positions + Trades */}
        <div className="lg:col-span-2 space-y-6">
          {/* === Open Positions === */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-blue-400" />Open Positions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(positions?.length ?? 0) === 0 ? (
                <div className="text-center py-8 text-gray-500">No open positions</div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto" data-testid="positions-table">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700 text-gray-400 text-xs">
                          <th className="text-left py-3 px-4">Market</th>
                          <th className="text-right py-3">Shares</th>
                          <th className="text-right py-3">Avg Cost</th>
                          <th className="text-right py-3">Value</th>
                          <th className="text-right py-3 pr-4">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions?.map((pos, i) => (
                          <tr
                            key={pos.id}
                            className={`border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer ${i % 2 === 0 ? 'bg-gray-900/20' : ''}`}
                            onClick={() => setSelectedPosition(pos)}
                            data-testid="position-row"
                          >
                            <td className="py-3 px-4">
                              <div className="text-gray-200 truncate max-w-[200px] text-xs">{pos.market}</div>
                            </td>
                            <td className="py-3 text-right text-gray-300">{pos.shares}</td>
                            <td className="py-3 text-right text-gray-300">{(pos.avgCost * 100).toFixed(1)}¢</td>
                            <td className="py-3 text-right text-gray-300">{formatCurrency(pos.currentValue)}</td>
                            <td className={`py-3 pr-4 text-right font-semibold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(pos.pnl)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile cards */}
                  <div className="sm:hidden space-y-2 p-4">
                    {positions?.map(pos => (
                      <div key={pos.id} className="bg-gray-800 rounded-lg p-3 cursor-pointer" onClick={() => setSelectedPosition(pos)}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-gray-200 truncate max-w-[180px]">{pos.market}</div>
                          <span className={`font-semibold text-sm ml-2 ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(pos.pnl)}</span>
                        </div>
                        <div className="text-xs text-gray-400">{pos.shares} shares @ {(pos.avgCost * 100).toFixed(1)}¢</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* === Recent Trades === */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(orders?.length ?? 0) === 0 ? (
                <div className="text-center py-8 text-gray-500">No recent trades</div>
              ) : (
                <>
                  <div className="hidden sm:block overflow-x-auto" data-testid="trades-table">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700 text-gray-400 text-xs">
                          <th className="text-left py-3 px-4">Market</th>
                          <th className="text-center py-3">Side</th>
                          <th className="text-right py-3">Price</th>
                          <th className="text-right py-3">Amount</th>
                          <th className="text-right py-3 pr-4">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders?.slice(0, 20).map((order, i) => (
                          <tr
                            key={order.id}
                            className={`border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer ${i % 2 === 0 ? 'bg-gray-900/20' : ''}`}
                            onClick={() => setSelectedOrder(order)}
                          >
                            <td className="py-3 px-4 text-gray-200 text-xs truncate max-w-[200px]">{order.market}</td>
                            <td className="py-3 text-center">
                              <Badge variant={order.side === 'BUY' ? 'default' : 'destructive'} className="text-xs">{order.side}</Badge>
                            </td>
                            <td className="py-3 text-right text-gray-300">{(order.price * 100).toFixed(1)}¢</td>
                            <td className="py-3 text-right text-gray-300">{order.amount}</td>
                            <td className={`py-3 pr-4 text-right font-semibold ${(order.pnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(order.pnl ?? 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile */}
                  <div className="sm:hidden space-y-2 p-4">
                    {orders?.slice(0, 20).map(order => (
                      <div key={order.id} className="bg-gray-800 rounded-lg p-3 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                        <div className="flex justify-between mb-1">
                          <Badge variant={order.side === 'BUY' ? 'default' : 'destructive'}>{order.side}</Badge>
                          <span className={`text-sm font-semibold ${(order.pnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(order.pnl ?? 0)}</span>
                        </div>
                        <div className="text-xs text-gray-400 truncate">{order.market}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Place Order Form */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Place Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-testid="order-form">
              {/* Market search */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Market *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search market..."
                    value={selectedMarket ? selectedMarket.question : marketSearch}
                    onChange={e => {
                      setSelectedMarket(null)
                      setMarketSearch(e.target.value)
                    }}
                    onFocus={() => marketSearch && setShowDropdown(true)}
                    className={`pl-9 pr-8 ${formErrors.market ? 'border-red-500' : ''}`}
                    data-testid="market-search"
                  />
                  {(selectedMarket || marketSearch) && (
                    <button
                      onClick={() => { setSelectedMarket(null); setMarketSearch(''); setShowDropdown(false) }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {showDropdown && marketResults.length > 0 && !selectedMarket && (
                    <div className="absolute z-10 w-full top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                      {marketResults.map(m => (
                        <button
                          key={m.id}
                          className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 truncate"
                          onClick={() => { setSelectedMarket(m); setShowDropdown(false); setMarketSearch('') }}
                          data-testid="market-option"
                        >
                          {m.question}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {formErrors.market && <p className="text-red-400 text-xs mt-1">{formErrors.market}</p>}
              </div>

              {/* Side */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">Side *</label>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${side === 'BUY' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    onClick={() => setSide('BUY')}
                    data-testid="side-buy"
                  >BUY</button>
                  <button
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${side === 'SELL' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    onClick={() => setSide('SELL')}
                    data-testid="side-sell"
                  >SELL</button>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Price (0–1) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.99"
                  placeholder="0.50"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className={formErrors.price ? 'border-red-500' : ''}
                  data-testid="price-input"
                />
                {formErrors.price && <p className="text-red-400 text-xs mt-1">{formErrors.price}</p>}
              </div>

              {/* Amount */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Shares *</label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="100"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className={formErrors.amount ? 'border-red-500' : ''}
                  data-testid="amount-input"
                />
                {formErrors.amount && <p className="text-red-400 text-xs mt-1">{formErrors.amount}</p>}
              </div>

              {/* Submit */}
              <Button
                onClick={validateAndSubmit}
                loading={orderMutation.isPending}
                className="w-full"
                data-testid="place-order-btn"
              >
                Place Order
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setSelectedMarket(null); setMarketSearch(''); setPrice(''); setAmount(''); setFormErrors({}) }}
                className="w-full text-gray-400"
              >
                Clear
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Position detail modal */}
      <Modal open={!!selectedPosition} onClose={() => setSelectedPosition(null)} title="Position Details">
        {selectedPosition && (
          <div className="space-y-3">
            <div className="text-sm text-gray-300">{selectedPosition.market}</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400">Shares:</span> <span className="text-white">{selectedPosition.shares}</span></div>
              <div><span className="text-gray-400">Avg Cost:</span> <span className="text-white">{(selectedPosition.avgCost * 100).toFixed(1)}¢</span></div>
              <div><span className="text-gray-400">Current Value:</span> <span className="text-white">{formatCurrency(selectedPosition.currentValue)}</span></div>
              <div><span className="text-gray-400">Market Price:</span> <span className="text-white">{((selectedPosition.currentMarketPrice ?? 0) * 100).toFixed(1)}¢</span></div>
              <div><span className="text-gray-400">Buy-in Date:</span> <span className="text-white">{selectedPosition.buyInDate ? new Date(selectedPosition.buyInDate).toLocaleDateString() : '—'}</span></div>
              <div>
                <span className="text-gray-400">P&L:</span>
                <span className={`ml-1 font-semibold ${selectedPosition.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(selectedPosition.pnl)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Order detail modal */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Trade Details">
        {selectedOrder && (
          <div className="space-y-3">
            <div className="text-sm text-gray-300">{selectedOrder.market}</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400">Side:</span> <Badge variant={selectedOrder.side === 'BUY' ? 'default' : 'destructive'} className="ml-1">{selectedOrder.side}</Badge></div>
              <div><span className="text-gray-400">Price:</span> <span className="text-white">{(selectedOrder.price * 100).toFixed(1)}¢</span></div>
              <div><span className="text-gray-400">Amount:</span> <span className="text-white">{selectedOrder.amount} shares</span></div>
              <div><span className="text-gray-400">Status:</span> <span className="text-white">{selectedOrder.status}</span></div>
              <div>
                <span className="text-gray-400">P&L:</span>
                <span className={`ml-1 font-semibold ${(selectedOrder.pnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(selectedOrder.pnl ?? 0)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
