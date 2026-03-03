import { useState, useCallback, useEffect, useRef } from 'react'
import {
  createCopyTrade,
  getCopyTrades,
  pauseCopyTrade,
  resumeCopyTrade,
  cancelCopyTrade,
  getWhaleTopMarkets,
  getCopyTradeHistory,
  CreateCopyTradeRequest,
  CopyTradeResponse,
} from '../lib/copy-trades-api'

interface UseCopyTradesState {
  copyTrades: CopyTradeResponse[]
  isLoading: boolean
  isCreating: boolean
  error: string | null
  executingCopyIds: Set<string>
}

export function useCopyTrades() {
  const [state, setState] = useState<UseCopyTradesState>({
    copyTrades: [],
    isLoading: false,
    isCreating: false,
    error: null,
    executingCopyIds: new Set(),
  })

  // Fetch copy trades on mount
  useEffect(() => {
    loadCopyTrades()
  }, [])

  const loadCopyTrades = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await getCopyTrades()
      setState(prev => ({
        ...prev,
        copyTrades: response.data,
        isLoading: false,
      }))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load copy trades'
      setState(prev => ({ ...prev, isLoading: false, error: errorMsg }))
    }
  }, [])

  const createCopy = useCallback(
    async (data: CreateCopyTradeRequest) => {
      setState(prev => ({ ...prev, isCreating: true, error: null }))
      try {
        const response = await createCopyTrade(data)
        await loadCopyTrades() // Refresh the list
        return response.data
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create copy trade'
        setState(prev => ({ ...prev, isCreating: false, error: errorMsg }))
        throw err
      }
    },
    [loadCopyTrades]
  )

  const pauseCopy = useCallback(async (copyTradeId: string) => {
    addExecuting(copyTradeId)
    try {
      await pauseCopyTrade(copyTradeId)
      setState(prev => ({
        ...prev,
        copyTrades: prev.copyTrades.map(t =>
          t.id === copyTradeId ? { ...t, status: 'paused' as const } : t
        ),
      }))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to pause copy trade'
      setState(prev => ({ ...prev, error: errorMsg }))
      throw err
    } finally {
      removeExecuting(copyTradeId)
    }
  }, [])

  const resumeCopy = useCallback(async (copyTradeId: string) => {
    addExecuting(copyTradeId)
    try {
      await resumeCopyTrade(copyTradeId)
      setState(prev => ({
        ...prev,
        copyTrades: prev.copyTrades.map(t =>
          t.id === copyTradeId ? { ...t, status: 'active' as const } : t
        ),
      }))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to resume copy trade'
      setState(prev => ({ ...prev, error: errorMsg }))
      throw err
    } finally {
      removeExecuting(copyTradeId)
    }
  }, [])

  const cancelCopy = useCallback(async (copyTradeId: string) => {
    addExecuting(copyTradeId)
    try {
      await cancelCopyTrade(copyTradeId)
      setState(prev => ({
        ...prev,
        copyTrades: prev.copyTrades.filter(t => t.id !== copyTradeId),
      }))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to cancel copy trade'
      setState(prev => ({ ...prev, error: errorMsg }))
      throw err
    } finally {
      removeExecuting(copyTradeId)
    }
  }, [])

  const addExecuting = (copyTradeId: string) => {
    setState(prev => ({
      ...prev,
      executingCopyIds: new Set([...prev.executingCopyIds, copyTradeId]),
    }))
  }

  const removeExecuting = (copyTradeId: string) => {
    setState(prev => {
      const newSet = new Set(prev.executingCopyIds)
      newSet.delete(copyTradeId)
      return { ...prev, executingCopyIds: newSet }
    })
  }

  return {
    copyTrades: state.copyTrades,
    isLoading: state.isLoading,
    isCreating: state.isCreating,
    error: state.error,
    executingCopyIds: state.executingCopyIds,
    loadCopyTrades,
    createCopy,
    pauseCopy,
    resumeCopy,
    cancelCopy,
  }
}

// Hook for getting whale top markets
export function useWhaleTopMarkets(whaleId: string) {
  const [markets, setMarkets] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!whaleId) return

    const loadMarkets = async () => {
      setIsLoading(true)
      try {
        const response = await getWhaleTopMarkets(whaleId, 5)
        setMarkets(response.data)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load markets'
        setError(errorMsg)
      } finally {
        setIsLoading(false)
      }
    }

    loadMarkets()
  }, [whaleId])

  return { markets, isLoading, error }
}

// Hook for getting copy trade history
export function useCopyTradeHistory(copyTradeId: string | null, autoRefresh = false) {
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadHistory = useCallback(async () => {
    if (!copyTradeId) return

    setIsLoading(true)
    try {
      const response = await getCopyTradeHistory(copyTradeId)
      setHistory(response.data)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load history'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [copyTradeId])

  useEffect(() => {
    loadHistory()

    if (autoRefresh) {
      intervalRef.current = setInterval(loadHistory, 5000) // Refresh every 5 seconds
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loadHistory, autoRefresh])

  return { history, isLoading, error, refresh: loadHistory }
}
