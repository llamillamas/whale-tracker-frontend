# Auto-Copy Feature - API Integration & Backend

**Phase 2, Task 2.3** | Status: COMPLETE
**Date Range:** March 7-8, 2026 (2 days)

---

## Overview

This document outlines the API integration for the auto-copy feature, including REST endpoints, WebSocket real-time updates, and data models.

---

## API Endpoints

### Copy Trade Management

#### 1. Create Copy Trade
```http
POST /api/copy-trades

Request:
{
  "whaleId": "whale_001",
  "selectedTradeIds": ["trade_1", "trade_2", "trade_3"],
  "copyPercentage": 25
}

Response (201):
{
  "copyTradeId": "copy_trade_abc123",
  "status": "active",
  "startDate": "2026-03-07T10:30:00Z"
}

Error Responses:
- 400: Invalid request (missing fields, invalid percentage)
- 401: Unauthorized (not logged in)
- 403: Insufficient balance
- 404: Whale or trades not found
```

#### 2. Get All Copy Trades
```http
GET /api/copy-trades?status=active&limit=20&offset=0

Response (200):
[
  {
    "id": "copy_trade_abc123",
    "whaleId": "whale_001",
    "whaleName": "TopTrader",
    "status": "active",
    "copyPercentage": 25,
    "tradesCount": 5,
    "totalProfit": 1250.50,
    "whaleProfit": 3500.75,
    "winRate": 72.5,
    "startDate": "2026-03-07T10:30:00Z",
    "lastUpdate": "2026-03-07T12:45:00Z"
  }
]
```

#### 3. Get Copy Trade Details
```http
GET /api/copy-trades/:copyTradeId

Response (200):
{
  "id": "copy_trade_abc123",
  "whaleId": "whale_001",
  "whaleName": "TopTrader",
  "status": "active",
  "copyPercentage": 25,
  "tradesCount": 5,
  "totalProfit": 1250.50,
  "whaleProfit": 3500.75,
  "winRate": 72.5,
  "startDate": "2026-03-07T10:30:00Z",
  "lastUpdate": "2026-03-07T12:45:00Z",
  "selectedTrades": [
    {
      "id": "trade_1",
      "market": "USDC/ETH",
      "side": "BUY",
      "amount": 1000,
      "price": 2000,
      "executedAmount": 1000,
      "status": "executed"
    }
  ]
}
```

#### 4. Pause Copy Trade
```http
PATCH /api/copy-trades/:copyTradeId
Content-Type: application/json

Request:
{
  "status": "paused"
}

Response (200):
{
  "id": "copy_trade_abc123",
  "status": "paused",
  "lastUpdate": "2026-03-07T12:50:00Z"
}
```

#### 5. Resume Copy Trade
```http
PATCH /api/copy-trades/:copyTradeId
Content-Type: application/json

Request:
{
  "status": "active"
}

Response (200):
{
  "id": "copy_trade_abc123",
  "status": "active",
  "lastUpdate": "2026-03-07T12:51:00Z"
}
```

#### 6. Cancel Copy Trade
```http
DELETE /api/copy-trades/:copyTradeId

Response (200):
{
  "success": true,
  "message": "Copy trade cancelled"
}
```

---

### Supporting Endpoints

#### 7. Get Whale Top Markets
```http
GET /api/whales/:whaleId/top-markets?limit=5

Response (200):
[
  "USDC/ETH",
  "USDC/BTC",
  "DAI/USDC",
  "WETH/USDC",
  "USDC/MATIC"
]
```

#### 8. Subscribe to Whale Trades (webhook setup)
```http
POST /api/whales/:whaleId/subscribe

Request:
{}

Response (200):
{
  "subscriptionId": "sub_xyz789",
  "whaleId": "whale_001"
}
```

#### 9. Get Copy Trade History
```http
GET /api/copy-trades/:copyTradeId/history?limit=50

Response (200):
[
  {
    "timestamp": "2026-03-07T11:00:00Z",
    "whaleTradeId": "trade_1",
    "whaleTradeDetails": {
      "market": "USDC/ETH",
      "side": "BUY",
      "amount": 1000,
      "price": 2000,
      "pnl": 500
    },
    "yourTradeId": "your_trade_1",
    "yourTradeDetails": {
      "market": "USDC/ETH",
      "side": "BUY",
      "amount": 250,
      "price": 2000.50,
      "pnl": 120
    },
    "copyStatus": "success",
    "executionTime": "0.45s"
  }
]
```

#### 10. Get Copy Trade Statistics
```http
GET /api/copy-trades/stats

Response (200):
{
  "totalActiveCopies": 3,
  "totalProfit": 4500.75,
  "totalWhaleProfit": 12000.25,
  "averageWinRate": 68.5,
  "totalTradesExecuted": 45,
  "conversionRate": 0.91
}
```

---

## WebSocket Real-Time Updates

### Connection
```
WebSocket URL: wss://api.whale-tracker.com/ws/copy-trades
Authentication: Token in query parameter (?token=JWT_TOKEN)

Example:
wss://api.whale-tracker.com/ws/copy-trades?token=eyJhbGciOiJIUzI1NiIs...
```

### Message Types

#### 1. Trade Executed
```json
{
  "type": "trade_executed",
  "copyTradeId": "copy_trade_abc123",
  "whaleTradeId": "trade_1",
  "yourTradeId": "your_trade_1",
  "status": "success",
  "timestamp": "2026-03-07T11:00:00Z",
  "details": {
    "whaleAmount": 1000,
    "yourAmount": 250,
    "price": 2000.50,
    "fee": 5.25,
    "pnl": 120
  }
}
```

#### 2. Status Changed
```json
{
  "type": "status_changed",
  "copyTradeId": "copy_trade_abc123",
  "status": "paused",
  "timestamp": "2026-03-07T12:50:00Z",
  "reason": "Manual pause by user"
}
```

#### 3. Performance Update
```json
{
  "type": "performance_update",
  "copyTradeId": "copy_trade_abc123",
  "totalProfit": 1250.50,
  "whaleProfit": 3500.75,
  "winRate": 72.5,
  "tradesCount": 5,
  "timestamp": "2026-03-07T12:45:00Z"
}
```

#### 4. Copy Failed
```json
{
  "type": "trade_executed",
  "copyTradeId": "copy_trade_abc123",
  "whaleTradeId": "trade_2",
  "status": "failed",
  "timestamp": "2026-03-07T11:15:00Z",
  "reason": "Insufficient balance",
  "suggestion": "Add more funds or reduce copy percentage"
}
```

### Client Operations

#### Subscribe to Copy Trade
```javascript
ws.send(JSON.stringify({
  action: "subscribe",
  copyTradeId: "copy_trade_abc123"
}))
```

#### Unsubscribe from Copy Trade
```javascript
ws.send(JSON.stringify({
  action: "unsubscribe",
  copyTradeId: "copy_trade_abc123"
}))
```

---

## Frontend Implementation

### API Functions (`src/lib/copy-trades-api.ts`)

```typescript
// Create copy trade
createCopyTrade(data: CreateCopyTradeRequest): Promise<CreateCopyTradeResponse>

// Get all copy trades
getCopyTrades(): Promise<CopyTradeResponse[]>

// Get specific copy trade
getCopyTrade(id: string): Promise<CopyTradeResponse>

// Pause/Resume/Cancel operations
pauseCopyTrade(id: string): Promise<CopyTradeUpdateResponse>
resumeCopyTrade(id: string): Promise<CopyTradeUpdateResponse>
cancelCopyTrade(id: string): Promise<{ success: boolean }>

// Supporting functions
getWhaleTopMarkets(whaleId: string, limit?: number): Promise<string[]>
getCopyTradeHistory(copyTradeId: string, limit?: number): Promise<Array>
getCopyTradeStats(): Promise<Statistics>
```

### Custom Hooks (`src/hooks/useCopyTrades.ts`)

```typescript
// Main hook for copy trade management
useCopyTrades(): {
  copyTrades: CopyTradeResponse[]
  isLoading: boolean
  isCreating: boolean
  error: string | null
  executingCopyIds: Set<string>
  loadCopyTrades: () => Promise<void>
  createCopy: (data: CreateCopyTradeRequest) => Promise<CreateCopyTradeResponse>
  pauseCopy: (id: string) => Promise<void>
  resumeCopy: (id: string) => Promise<void>
  cancelCopy: (id: string) => Promise<void>
}

// Whale top markets hook
useWhaleTopMarkets(whaleId: string): {
  markets: string[]
  isLoading: boolean
  error: string | null
}

// Copy trade history hook
useCopyTradeHistory(copyTradeId: string | null, autoRefresh?: boolean): {
  history: Array
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}
```

### WebSocket Manager (`src/lib/copy-trades-websocket.ts`)

```typescript
// Get WebSocket instance
getCopyTradesWebSocket(apiUrl: string): CopyTradesWebSocket

// Connect to WebSocket
ws.connect(): Promise<void>

// Subscribe to updates
ws.subscribeToCopyTrade(copyTradeId: string): void
ws.unsubscribeFromCopyTrade(copyTradeId: string): void

// Message handlers
ws.onMessage(type: string, handler: MessageHandler): () => void
ws.onError(handler: ErrorHandler): () => void
ws.onConnected(handler: ConnectionHandler): () => void

// Check connection status
ws.isConnected(): boolean

// Cleanup
disposeCopyTradesWebSocket(): void
```

---

## Error Handling

### HTTP Error Responses

| Code | Error | Description |
|------|-------|-------------|
| 400 | `invalid_request` | Missing required fields or invalid data format |
| 401 | `unauthorized` | Not logged in or invalid token |
| 403 | `insufficient_balance` | Not enough funds to execute copy |
| 404 | `not_found` | Whale or copy trade not found |
| 409 | `conflict` | Copy trade already exists for this whale |
| 429 | `rate_limit` | Too many requests |
| 500 | `server_error` | Server error during execution |

### Example Error Response
```json
{
  "error": "insufficient_balance",
  "message": "Insufficient USDC balance. Need $250, have $150.",
  "required": 250,
  "available": 150
}
```

### WebSocket Connection Errors

- **Auto-reconnect:** Exponential backoff (1s → 2s → 4s → 8s → 16s)
- **Max retries:** 5 attempts
- **Message queue:** Pending messages queued until reconnection

---

## Performance Optimization

### Request Optimization
- ✅ Batch status updates (poll every 5 seconds, not per trade)
- ✅ Lazy-load history (paginate with limit parameter)
- ✅ Cache whale top markets (5-minute TTL)
- ✅ Cancel in-flight requests on component unmount

### WebSocket Optimization
- ✅ Subscribe only to active copy trades
- ✅ Unsubscribe from cancelled trades immediately
- ✅ Single shared WebSocket connection (singleton)
- ✅ Heartbeat every 30 seconds (keep-alive)

---

## Security Considerations

### Authentication
- ✅ JWT token in WebSocket query parameter
- ✅ Token refresh before expiry
- ✅ HTTPS/WSS only in production

### Authorization
- ✅ User can only access their own copy trades
- ✅ API validates ownership on all endpoints
- ✅ Rate limiting per user (100 requests/minute)

### Data Validation
- ✅ Copy percentage: 10-100% only
- ✅ Trade IDs: UUID format validation
- ✅ Amount validation: >= 1 unit, <= account balance

---

## Testing Checklist

### API Testing
- [ ] Create copy trade with valid data
- [ ] Attempt create with insufficient balance
- [ ] Get copy trades (empty, single, multiple)
- [ ] Pause/resume/cancel operations
- [ ] Error responses return correct codes

### WebSocket Testing
- [ ] Connect/disconnect gracefully
- [ ] Receive trade_executed messages
- [ ] Receive status_changed messages
- [ ] Receive performance_update messages
- [ ] Auto-reconnect on disconnection
- [ ] Message queue works while disconnected

### Integration Testing
- [ ] Create copy → appears in list
- [ ] Pause copy → status updates in UI
- [ ] Real-time updates appear immediately
- [ ] Cancel copy → removed from list
- [ ] No stale data after operations

---

## API Response Time SLA

| Operation | Target | Threshold |
|-----------|--------|-----------|
| Create copy trade | <2s | <5s |
| Pause/Resume | <1s | <3s |
| List copy trades | <500ms | <2s |
| WebSocket message | <100ms | <500ms |

---

## References

- **API Documentation:** https://api.whale-tracker.com/docs
- **WebSocket Protocol:** https://tools.ietf.org/html/rfc6455
- **Error Handling:** https://api.whale-tracker.com/docs/errors

---

**Status:** ✅ API INTEGRATION COMPLETE
**Next Task:** Task 2.4 - Scale Testing
**Date:** March 8, 2026
