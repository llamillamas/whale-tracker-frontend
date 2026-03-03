import { api } from './api'

export interface CreateCopyTradeRequest {
  whaleId: string
  selectedTradeIds: string[]
  copyPercentage: number
}

export interface CreateCopyTradeResponse {
  copyTradeId: string
  status: 'active' | 'pending'
  startDate: string
}

export interface CopyTradeResponse {
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
  lastUpdate?: string
  failureReason?: string
}

export interface CopyTradeUpdateResponse {
  id: string
  status: string
  lastUpdate: string
}

// Create a new copy trade
export const createCopyTrade = (data: CreateCopyTradeRequest) =>
  api.post<CreateCopyTradeResponse>('/copy-trades', data)

// Get all copy trades for logged-in user
export const getCopyTrades = () =>
  api.get<CopyTradeResponse[]>('/copy-trades')

// Get specific copy trade details
export const getCopyTrade = (id: string) =>
  api.get<CopyTradeResponse>(`/copy-trades/${id}`)

// Pause a copy trade
export const pauseCopyTrade = (id: string) =>
  api.patch<CopyTradeUpdateResponse>(`/copy-trades/${id}`, { status: 'paused' })

// Resume a paused copy trade
export const resumeCopyTrade = (id: string) =>
  api.patch<CopyTradeUpdateResponse>(`/copy-trades/${id}`, { status: 'active' })

// Cancel a copy trade
export const cancelCopyTrade = (id: string) =>
  api.delete<{ success: boolean }>(`/copy-trades/${id}`)

// Subscribe to whale trade updates (real-time)
export const subscribeToWhaleTrades = (whaleId: string) =>
  api.post<{ subscriptionId: string }>(`/whales/${whaleId}/subscribe`, {})

// Unsubscribe from whale trade updates
export const unsubscribeFromWhaleTrades = (whaleId: string) =>
  api.post<{ success: boolean }>(`/whales/${whaleId}/unsubscribe`, {})

// Get top markets for a whale
export const getWhaleTopMarkets = (whaleId: string, limit = 5) =>
  api.get<string[]>(`/whales/${whaleId}/top-markets?limit=${limit}`)

// Get copy trade history (for analytics)
export const getCopyTradeHistory = (copyTradeId: string, limit = 50) =>
  api.get<Array<{
    timestamp: string
    whaleTradeId: string
    whaleTradeDetails: any
    yourTradeId: string
    yourTradeDetails: any
    copyStatus: 'success' | 'partial' | 'failed'
    reason?: string
  }>>(`/copy-trades/${copyTradeId}/history?limit=${limit}`)

// Get copy trade statistics
export const getCopyTradeStats = () =>
  api.get<{
    totalActiveCopies: number
    totalProfit: number
    totalWhaleProfit: number
    averageWinRate: number
    totalTradesExecuted: number
    conversionRate: number
  }>('/copy-trades/stats')
