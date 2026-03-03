import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('whale_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Types
export interface Whale {
  id: string
  address: string
  username: string
  roi: number
  trades: number
  followers: number
  avatar?: string
  winRate?: number
  profit30d?: number
}

export interface Trade {
  id: string
  date: string
  market: string
  marketId: string
  side: 'BUY' | 'SELL'
  price: number
  amount: number
  pnl: number
  fee?: number
}

export interface Position {
  id: string
  market: string
  marketId: string
  shares: number
  avgCost: number
  currentValue: number
  pnl: number
  pnlPercent: number
  buyInDate?: string
  currentMarketPrice?: number
}

export interface Portfolio {
  totalBalance: number
  totalPositionValue: number
  cash: number
  totalPnl: number
  totalPnlPercent: number
}

export interface Market {
  id: string
  question: string
  currentPrice?: number
  volume?: number
}

export interface Order {
  id: string
  marketId: string
  market: string
  side: 'BUY' | 'SELL'
  price: number
  amount: number
  status: string
  pnl?: number
}

export interface PnLPoint {
  date: string
  pnl: number
}

// Auth
export const authLogin = (data: { signature: string; message: string; address: string }) =>
  api.post<{ user: { address: string; username: string }; token: string }>('/auth/login', data)

// Whales
export const getWhales = () => api.get<Whale[]>('/whales')
export const getWhale = (id: string) => api.get<Whale>(`/whales/${id}`)
export const getWhaleTrades = (id: string, page = 1) => api.get<{ trades: Trade[]; total: number }>(`/whales/${id}/trades?page=${page}`)
export const getWhalePnL = (id: string) => api.get<PnLPoint[]>(`/whales/${id}/pnl`)

// User portfolio
export const getPortfolio = () => api.get<Portfolio>('/user/portfolio')
export const getPositions = () => api.get<Position[]>('/user/positions')
export const getOrders = () => api.get<Order[]>('/user/orders')

// Markets
export const searchMarkets = (q: string) => api.get<Market[]>(`/markets?q=${encodeURIComponent(q)}`)
export const getMarket = (id: string) => api.get<Market>(`/markets/${id}`)

// Place order
export const placeOrder = (data: { marketId: string; side: 'BUY' | 'SELL'; price: number; amount: number }) =>
  api.post<{ order_id: string; status: string; pnl?: number }>('/orders', data)
