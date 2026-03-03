import React, { useState } from 'react'
import { CopyTradeStatus, CopyTradeData } from './CopyTradeStatus'
import { Badge } from './ui/badge'

interface CopiedTradersTabProps {
  copyTrades: CopyTradeData[]
  isLoading?: boolean
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onCancel?: (id: string) => void
}

export function CopiedTradersTab({
  copyTrades,
  isLoading = false,
  onPause,
  onResume,
  onCancel,
}: CopiedTradersTabProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'completed'>('all')

  const filteredTrades = copyTrades.filter(trade => {
    if (filterStatus === 'all') return true
    return trade.status === filterStatus
  })

  const activeCount = copyTrades.filter(t => t.status === 'active').length
  const totalProfit = copyTrades.reduce((sum, t) => sum + t.totalProfit, 0)
  const totalWhaleProfit = copyTrades.reduce((sum, t) => sum + t.whaleProfit, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">ACTIVE COPIES</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
          <p className="text-xs text-gray-600 mt-2">of {copyTrades.length} total</p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">YOUR TOTAL P&L</p>
          <p className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-2">across all copies</p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">WHALES' TOTAL P&L</p>
          <p className={`text-2xl font-bold mt-1 ${totalWhaleProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalWhaleProfit >= 0 ? '+' : ''}${totalWhaleProfit.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-2">reference for comparison</p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">VS WHALES</p>
          <p className={`text-2xl font-bold mt-1 ${totalProfit - totalWhaleProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalProfit - totalWhaleProfit >= 0 ? '+' : ''}${(totalProfit - totalWhaleProfit).toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-2">performance delta</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b">
        <div className="flex gap-2">
          {(['all', 'active', 'paused', 'completed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filterStatus === status
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {status === 'all' && `All (${copyTrades.length})`}
              {status === 'active' && `Active (${copyTrades.filter(t => t.status === 'active').length})`}
              {status === 'paused' && `Paused (${copyTrades.filter(t => t.status === 'paused').length})`}
              {status === 'completed' && `Completed (${copyTrades.filter(t => t.status === 'completed').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Trades List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading copied trades...</p>
        </div>
      ) : filteredTrades.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {filterStatus === 'all'
              ? 'No copied traders yet. Find a whale and start copying!'
              : `No ${filterStatus} copy trades.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrades.map(trade => (
            <CopyTradeStatus
              key={trade.id}
              copyTrade={trade}
              onPause={onPause}
              onResume={onResume}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {copyTrades.length === 0 && (
        <div className="text-center py-12 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-900 font-medium mb-2">Start Copying Whales!</p>
          <p className="text-blue-700 text-sm">
            Go to the Whales page and click "Copy Trader" on any whale's profile to get started.
          </p>
        </div>
      )}
    </div>
  )
}
