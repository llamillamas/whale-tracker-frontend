import React, { useState } from 'react'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export interface Trade {
  id: string
  date: string
  market: string
  side: 'BUY' | 'SELL'
  price: number
  amount: number
  pnl: number
}

interface CopyTraderModalProps {
  isOpen: boolean
  whaleId: string
  whaleName: string
  trades: Trade[]
  topMarkets: string[]
  onClose: () => void
  onConfirm: (selectedTrades: string[], copyPercentage: number) => void
  isLoading?: boolean
}

const COPY_PERCENTAGES = [10, 25, 50, 100] as const

export function CopyTraderModal({
  isOpen,
  whaleId,
  whaleName,
  trades,
  topMarkets,
  onClose,
  onConfirm,
  isLoading = false,
}: CopyTraderModalProps) {
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set())
  const [copyPercentage, setCopyPercentage] = useState<10 | 25 | 50 | 100>(25)
  const [step, setStep] = useState<'review' | 'confirm'>('review')

  const handleToggleTrade = (tradeId: string) => {
    const newSelected = new Set(selectedTrades)
    if (newSelected.has(tradeId)) {
      newSelected.delete(tradeId)
    } else {
      newSelected.add(tradeId)
    }
    setSelectedTrades(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTrades.size === trades.length) {
      setSelectedTrades(new Set())
    } else {
      setSelectedTrades(new Set(trades.map(t => t.id)))
    }
  }

  const handleConfirm = () => {
    if (selectedTrades.size === 0) {
      alert('Please select at least one trade to copy')
      return
    }
    onConfirm(Array.from(selectedTrades), copyPercentage)
    setStep('review')
    setSelectedTrades(new Set())
    setCopyPercentage(25)
    onClose()
  }

  const recentTrades = trades.slice(0, 10) // Show last 10 trades
  const allSelected = selectedTrades.size === recentTrades.length
  const someSelected = selectedTrades.size > 0 && selectedTrades.size < recentTrades.length

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Copy Trader: ${whaleName}`}>
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {step === 'review' && (
          <>
            {/* Top Markets */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Top Markets</h3>
              <div className="flex flex-wrap gap-2">
                {topMarkets.map(market => (
                  <Badge key={market} variant="secondary">
                    {market}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recent Trades Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-700">Recent Trades (Last 10)</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {allSelected ? 'Deselect All' : someSelected ? 'Some Selected' : 'Select All'}
                </Button>
              </div>

              <div className="space-y-2 border rounded p-2 bg-gray-50">
                {recentTrades.length === 0 ? (
                  <p className="text-sm text-gray-500">No trades available</p>
                ) : (
                  recentTrades.map(trade => (
                    <label
                      key={trade.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTrades.has(trade.id)}
                        onChange={() => handleToggleTrade(trade.id)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm font-medium truncate">{trade.market}</span>
                          <Badge variant={trade.side === 'BUY' ? 'default' : 'destructive'}>
                            {trade.side}
                          </Badge>
                        </div>
                        <div className="flex justify-between gap-2 mt-1">
                          <span className="text-xs text-gray-600">
                            {trade.amount} @ ${trade.price.toFixed(2)}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(trade.date).toLocaleDateString()}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {selectedTrades.size > 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  {selectedTrades.size} trade{selectedTrades.size !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Copy Percentage Selection */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Copy Size (%)</h3>
              <div className="grid grid-cols-4 gap-2">
                {COPY_PERCENTAGES.map(percentage => (
                  <Button
                    key={percentage}
                    variant={copyPercentage === percentage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCopyPercentage(percentage as any)}
                    className="w-full"
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                You'll copy {copyPercentage}% of the whale's trade size
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={selectedTrades.size === 0 || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Copying...' : 'Next'}
              </Button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm font-medium text-blue-900">Confirm Copy Trading Setup</p>
              <p className="text-sm text-blue-700 mt-1">
                Ready to start copying {selectedTrades.size} trade{selectedTrades.size !== 1 ? 's' : ''} from{' '}
                <span className="font-semibold">{whaleName}</span> at{' '}
                <span className="font-semibold">{copyPercentage}%</span> allocation.
              </p>
            </div>

            <div className="bg-gray-50 rounded p-3 space-y-2">
              <p className="text-xs text-gray-600">
                <strong>Whale:</strong> {whaleName} ({whaleId.slice(0, 8)}...)
              </p>
              <p className="text-xs text-gray-600">
                <strong>Trades:</strong> {selectedTrades.size} selected
              </p>
              <p className="text-xs text-gray-600">
                <strong>Copy Size:</strong> {copyPercentage}% of whale trades
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>Disclaimer:</strong> Past performance does not guarantee future results. Copy trading
                carries risk. Your copied trades may not match the whale's exactly due to market conditions and
                timing.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('review')} className="flex-1" disabled={isLoading}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={isLoading} className="flex-1">
                {isLoading ? 'Confirming...' : 'Confirm & Copy'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
