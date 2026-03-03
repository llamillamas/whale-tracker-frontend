import React from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Loader } from 'lucide-react'

export interface CopyTradeData {
  id: string
  whaleId: string
  whaleName: string
  status: 'active' | 'paused' | 'completed' | 'failed'
  copyPercentage: number
  tradesCount: number
  totalProfit: number
  whaleProfit: number
  winRate: number
  startDate: string
  isExecuting?: boolean
}

interface CopyTradeStatusProps {
  copyTrade: CopyTradeData
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onCancel?: (id: string) => void
}

export function CopyTradeStatus({
  copyTrade,
  onPause,
  onResume,
  onCancel,
}: CopyTradeStatusProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-300',
    paused: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    completed: 'bg-blue-100 text-blue-800 border-blue-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
  }

  const performanceGain = copyTrade.totalProfit - copyTrade.whaleProfit
  const performanceGainPercent = copyTrade.whaleProfit !== 0
    ? ((performanceGain / Math.abs(copyTrade.whaleProfit)) * 100).toFixed(1)
    : 0

  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{copyTrade.whaleName}</h3>
          <p className="text-xs text-gray-500">
            Copying at <span className="font-medium">{copyTrade.copyPercentage}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {copyTrade.isExecuting && (
            <Loader className="w-4 h-4 text-blue-600 animate-spin" />
          )}
          <Badge className={statusColors[copyTrade.status]} variant="outline">
            {copyTrade.status === 'active' && '🟢 Active'}
            {copyTrade.status === 'paused' && '⏸️ Paused'}
            {copyTrade.status === 'completed' && '✅ Completed'}
            {copyTrade.status === 'failed' && '❌ Failed'}
          </Badge>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded">
        <div>
          <p className="text-xs text-gray-600">Your P&L</p>
          <p className={`text-sm font-semibold ${copyTrade.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {copyTrade.totalProfit >= 0 ? '+' : ''}${copyTrade.totalProfit.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Whale P&L</p>
          <p className={`text-sm font-semibold ${copyTrade.whaleProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {copyTrade.whaleProfit >= 0 ? '+' : ''}${copyTrade.whaleProfit.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Win Rate</p>
          <p className="text-sm font-semibold text-blue-600">{copyTrade.winRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Comparison */}
      <div className="mb-4 p-2 bg-blue-50 rounded border border-blue-100">
        <p className="text-xs text-blue-700">
          <span className="font-medium">vs Whale:</span>{' '}
          <span className={performanceGain >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {performanceGain >= 0 ? '+' : ''}${performanceGain.toFixed(2)} ({performanceGainPercent}%)
          </span>
        </p>
      </div>

      {/* Trade Count and Start Date */}
      <div className="text-xs text-gray-600 mb-3 space-y-1">
        <p>Trades: <span className="font-medium">{copyTrade.tradesCount}</span></p>
        <p>Started: <span className="font-medium">{new Date(copyTrade.startDate).toLocaleDateString()}</span></p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        {copyTrade.status === 'active' && onPause && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPause(copyTrade.id)}
            className="flex-1"
          >
            Pause
          </Button>
        )}
        {copyTrade.status === 'paused' && onResume && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResume(copyTrade.id)}
            className="flex-1"
          >
            Resume
          </Button>
        )}
        {(copyTrade.status === 'active' || copyTrade.status === 'paused') && onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(copyTrade.id)}
            className="flex-1 text-red-600 hover:text-red-700"
          >
            Stop
          </Button>
        )}
      </div>
    </div>
  )
}
