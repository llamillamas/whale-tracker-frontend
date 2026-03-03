/**
 * WebSocket Manager for Real-Time Copy Trade Updates
 * 
 * Handles:
 * - Trade execution notifications
 * - Copy trade status changes
 * - Performance metrics updates
 * - Error/failure notifications
 */

type MessageHandler = (data: any) => void
type ErrorHandler = (error: Error) => void
type ConnectionHandler = () => void

export interface TradeExecutedMessage {
  type: 'trade_executed'
  copyTradeId: string
  whaleTradeId: string
  yourTradeId: string
  status: 'success' | 'partial' | 'failed'
  timestamp: string
  reason?: string
}

export interface CopyTradeStatusMessage {
  type: 'status_changed'
  copyTradeId: string
  status: 'active' | 'paused' | 'completed' | 'failed'
  timestamp: string
  reason?: string
}

export interface PerformanceUpdateMessage {
  type: 'performance_update'
  copyTradeId: string
  totalProfit: number
  whaleProfit: number
  winRate: number
  tradesCount: number
  timestamp: string
}

export type CopyTradeMessage = 
  | TradeExecutedMessage 
  | CopyTradeStatusMessage 
  | PerformanceUpdateMessage

class CopyTradesWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map()
  private errorHandlers: Set<ErrorHandler> = new Set()
  private connectionHandlers: Set<ConnectionHandler> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageQueue: any[] = []
  private isConnecting = false

  constructor(apiUrl: string) {
    // Convert HTTP(S) to WS(S)
    this.url = apiUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')
      .replace('/api', '/ws/copy-trades')
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        resolve()
        return
      }

      this.isConnecting = true

      try {
        this.ws = new WebSocket(`${this.url}?token=${this.getAuthToken()}`)

        this.ws.onopen = () => {
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.flushMessageQueue()
          this.connectionHandlers.forEach(handler => handler())
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (event) => {
          const error = new Error('WebSocket error')
          this.errorHandlers.forEach(handler => handler(error))
          reject(error)
        }

        this.ws.onclose = () => {
          this.isConnecting = false
          this.attemptReconnect()
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.reconnectAttempts = 0
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      const error = new Error('Max reconnection attempts reached')
      this.errorHandlers.forEach(handler => handler(error))
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error)
      })
    }, delay)
  }

  private handleMessage(data: string): void {
    try {
      const message: CopyTradeMessage = JSON.parse(data)

      // Call type-specific handlers
      const handlers = this.messageHandlers.get(message.type)
      if (handlers) {
        handlers.forEach(handler => handler(message))
      }

      // Call generic handlers for any message type
      const anyHandlers = this.messageHandlers.get('*')
      if (anyHandlers) {
        anyHandlers.forEach(handler => handler(message))
      }
    } catch (error) {
      const parseError = new Error(`Failed to parse WebSocket message: ${data}`)
      this.errorHandlers.forEach(handler => handler(parseError))
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift()
      this.sendMessage(message)
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  private sendMessage(message: any): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message))
    } else {
      this.messageQueue.push(message)
    }
  }

  // Subscribe to copy trade updates
  subscribeToCopyTrade(copyTradeId: string): void {
    this.sendMessage({
      action: 'subscribe',
      copyTradeId,
    })
  }

  // Unsubscribe from copy trade updates
  unsubscribeFromCopyTrade(copyTradeId: string): void {
    this.sendMessage({
      action: 'unsubscribe',
      copyTradeId,
    })
  }

  // Add message handler
  onMessage(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }
    this.messageHandlers.get(type)!.add(handler)

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type)
      if (handlers) {
        handlers.delete(handler)
      }
    }
  }

  // Add error handler
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  // Add connection handler
  onConnected(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler)
    return () => this.connectionHandlers.delete(handler)
  }

  private getAuthToken(): string {
    return localStorage.getItem('whale_token') || ''
  }
}

// Singleton instance
let instance: CopyTradesWebSocket | null = null

export function getCopyTradesWebSocket(apiUrl: string): CopyTradesWebSocket {
  if (!instance) {
    instance = new CopyTradesWebSocket(apiUrl)
  }
  return instance
}

export function disposeCopyTradesWebSocket(): void {
  if (instance) {
    instance.disconnect()
    instance = null
  }
}
