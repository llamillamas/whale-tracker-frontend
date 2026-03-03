# Auto-Copy Feature - UI Implementation

**Phase 2, Task 2.2** | Status: IN PROGRESS
**Date Range:** March 5-6, 2026 (2 days)

---

## Overview

The Auto-Copy feature allows users to automatically copy the trading strategies of top whales (successful traders). This document outlines the UI components, user flows, and integration points.

---

## Components Implemented

### 1. **CopyTraderModal** (`src/components/CopyTraderModal.tsx`)
**Purpose:** Modal dialog for initiating a copy trade with a whale

**Features:**
- Two-step wizard: Review → Confirm
- Display whale's top markets (tags)
- List recent 10 trades with selection checkboxes
- Copy percentage selector (10%, 25%, 50%, 100%)
- Risk disclaimer on confirmation step
- Loading states during API calls

**Props:**
```typescript
interface CopyTraderModalProps {
  isOpen: boolean
  whaleId: string
  whaleName: string
  trades: Trade[]           // Last 10 trades
  topMarkets: string[]      // Top 5 markets by volume
  onClose: () => void
  onConfirm: (selectedTrades: string[], copyPercentage: number) => void
  isLoading?: boolean
}
```

**User Flow:**
1. User clicks "Copy Trader" button on whale profile
2. Modal opens showing:
   - Whale's top markets
   - Recent 10 trades (with BUY/SELL badges)
   - Trade details (amount, price, P&L, date)
3. User selects trades to copy (or "Select All")
4. User chooses copy percentage (10-100%)
5. User clicks "Next" to confirmation step
6. Confirmation step shows summary and disclaimer
7. User clicks "Confirm & Copy" to execute

**Screenshot Descriptions:**
- **Step 1 (Review):**
  - Green badge sections showing top 5 markets
  - Checklist of 10 recent trades
  - Each trade shows: Market, Side (BUY=blue/SELL=red), Amount, Price, P&L (+green/-red), Date
  - Four percentage buttons at bottom (10%, 25%, 50%, 100%)
  - Cancel/Next buttons

- **Step 2 (Confirm):**
  - Blue info box: "Confirm Copy Trading Setup"
  - Summary: Whale name, trade count, copy percentage
  - Yellow warning box: Disclaimer about past performance
  - Back/Confirm buttons

---

### 2. **CopyTradeStatus** (`src/components/CopyTradeStatus.tsx`)
**Purpose:** Card component showing active/completed copy trade status and performance

**Features:**
- Status badge (🟢 Active, ⏸️ Paused, ✅ Completed, ❌ Failed)
- Real-time performance metrics
- Comparison with whale's performance
- Pause/Resume/Stop actions
- Animated spinner during execution

**Props:**
```typescript
interface CopyTradeStatusProps {
  copyTrade: CopyTradeData
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onCancel?: (id: string) => void
}

interface CopyTradeData {
  id: string
  whaleId: string
  whaleName: string
  status: 'active' | 'paused' | 'completed' | 'failed'
  copyPercentage: number
  tradesCount: number
  totalProfit: number          // Your profit
  whaleProfit: number          // Whale's profit
  winRate: number              // 0-100%
  startDate: string
  isExecuting?: boolean
}
```

**Display Elements:**
- Header: Whale name + Copy% + Status badge + Spinner (if executing)
- Metrics grid: Your P&L | Whale P&L | Win Rate
- Comparison box: Your P&L vs Whale P&L (delta)
- Footer: Trade count, start date, action buttons

**Screenshot Description:**
- Card with whale name, copy percentage, green status badge
- Three-column metric display:
  - "Your P&L" (green if positive)
  - "Whale P&L" (gray for reference)
  - "Win Rate %"
- Blue box showing performance comparison
- Action buttons (Pause/Resume/Stop) at bottom

---

### 3. **CopiedTradersTab** (`src/components/CopiedTradersTab.tsx`)
**Purpose:** Tab component for dashboard showing all copied traders

**Features:**
- Summary cards: Active count, Your total P&L, Whale P&L, Performance delta
- Filter tabs: All, Active, Paused, Completed
- Grid layout of CopyTradeStatus cards
- Empty state with CTA

**Props:**
```typescript
interface CopiedTradersTabProps {
  copyTrades: CopyTradeData[]
  isLoading?: boolean
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onCancel?: (id: string) => void
}
```

**Layout:**
1. **Top Summary (4 cards):**
   - Active Copies count
   - Your total P&L
   - Whales' total P&L
   - Performance vs whales (delta)

2. **Filter Tabs:** All | Active | Paused | Completed

3. **Content Grid:**
   - 3-column grid on desktop, 1 column on mobile
   - Each row is a CopyTradeStatus card
   - Empty state if no trades

**Screenshot Description:**
- Top: 4 white cards with metrics in grid layout
- Middle: Horizontal filter tabs (All, Active, Paused, Completed)
- Bottom: 3-column grid of copy trade cards
- Each card shows whale name, status, metrics, and action buttons

---

## Integration Points

### 1. **Whale Profile Page** (`WhaleProfilePage.tsx`)
**Add:**
```typescript
// In whale profile header or details section
<Button 
  onClick={() => setShowCopyModal(true)}
  className="bg-blue-600"
>
  Copy Trader
</Button>

<CopyTraderModal
  isOpen={showCopyModal}
  whaleId={whale.id}
  whaleName={whale.username}
  trades={trades}
  topMarkets={getTopMarkets(trades)}
  onClose={() => setShowCopyModal(false)}
  onConfirm={handleCopyConfirm}
/>
```

**Data Requirements:**
- Whale ID and username
- Last 10 trades with full details
- Top 5 markets by trade volume

---

### 2. **Leaderboard/Whales Page** (`WhalesPage.tsx`)
**Add:**
- "🟢 Active Copy" badge next to whales you're already copying
- Animated pulse on copy badges to indicate "copying right now"

**Logic:**
```typescript
const isCopiedByUser = copiedWhaleIds.includes(whale.id)

<Badge className={isCopiedByUser ? "animate-pulse" : ""}>
  {isCopiedByUser ? "🟢 Active Copy" : ""}
</Badge>
```

---

### 3. **Dashboard Page** (`DashboardPage.tsx`)
**Add:**
```typescript
// In tabs next to Portfolio, Orders
<div className="tab-content">
  {activeTab === 'copiedTraders' && (
    <CopiedTradersTab
      copyTrades={copiedTrades}
      isLoading={isLoading}
      onPause={handlePause}
      onResume={handleResume}
      onCancel={handleCancel}
    />
  )}
</div>
```

**Data Requirements:**
- List of all copy trades
- Real-time status updates
- Performance calculations

---

## API Integration (Task 2.3)

The UI components are structured to handle these API calls:

### Create Copy Trade
```typescript
POST /api/copy-trades
{
  whaleId: string
  selectedTradeIds: string[]
  copyPercentage: number
}
→ { copyTradeId: string, status: 'active' }
```

### Get Copy Trades
```typescript
GET /api/copy-trades
→ CopyTradeData[]
```

### Pause/Resume Copy Trade
```typescript
PATCH /api/copy-trades/:id
{ status: 'paused' | 'active' }
→ { success: true }
```

### Cancel Copy Trade
```typescript
DELETE /api/copy-trades/:id
→ { success: true }
```

---

## Styling Details

### Color Scheme
- **Active:** Green (#10b981)
- **Paused:** Yellow (#f59e0b)
- **Completed:** Blue (#3b82f6)
- **Failed:** Red (#ef4444)
- **Text:** Gray-700 for headers, Gray-600 for secondary

### Responsive Design
- **Desktop:** 3-column grid for copy trade cards
- **Tablet:** 2-column grid
- **Mobile:** 1 column, full width cards

### Animations
- Spinner on "Executing" trades
- Pulse animation on active copy badges
- Smooth transitions on status changes
- Hover shadow on cards

---

## Accessibility Features

✅ ARIA labels on buttons and badges
✅ Semantic HTML (form inputs with labels)
✅ Keyboard navigation support
✅ High contrast colors
✅ Clear error messages

---

## Success Criteria (Task 2.2)

- [x] Copy button visible on whale profiles
- [x] Copy modal functional and user-friendly
- [x] User can select % allocation
- [x] Dashboard shows copied traders
- [x] Copy performance tracked visually
- [x] Responsive on mobile

---

## File Structure

```
src/components/
├── CopyTraderModal.tsx          (388 lines)
├── CopyTradeStatus.tsx          (172 lines)
├── CopiedTradersTab.tsx         (180 lines)
└── ui/
    ├── modal.tsx                (existing)
    ├── button.tsx               (existing)
    └── badge.tsx                (existing)

src/pages/
├── DashboardPage.tsx            (modified - add tab)
├── WhaleProfilePage.tsx         (modified - add button)
└── WhalesPage.tsx               (modified - add badge)
```

---

## Testing Checklist

### Component Tests
- [ ] CopyTraderModal opens/closes correctly
- [ ] Trade selection toggle works
- [ ] Copy percentage buttons are mutually exclusive
- [ ] Confirmation step shows correct summary
- [ ] CopyTradeStatus displays all metrics
- [ ] Action buttons trigger callbacks
- [ ] CopiedTradersTab filters work

### Integration Tests
- [ ] Copy button on whale profile opens modal
- [ ] Modal submits correct data to parent
- [ ] Copied trades appear in dashboard
- [ ] Copy badges appear on whales list
- [ ] Real-time updates working

### Visual Tests
- [ ] Mobile responsive layout
- [ ] Colors match design system
- [ ] Animations smooth
- [ ] Loading states visible
- [ ] Error states clear

---

## Next Steps (Task 2.3)

1. Implement API calls in hooks
2. Add real-time WebSocket updates
3. Handle error scenarios
4. Add undo/rollback functionality

---

**Status:** ✅ UI COMPONENTS COMPLETE
**Ready for:** API Integration (Task 2.3)
**Date:** March 5, 2026
