# Production Monitoring Setup

**Phase 2, Task 2.5** | Status: TEMPLATE READY
**Date:** March 10, 2026

---

## Monitoring Stack

### 1. Error Tracking: Sentry
**Status:** TO BE CONFIGURED

#### Setup Steps
```bash
# 1. Create Sentry account at https://sentry.io
# 2. Create new project: Whale Tracker Frontend
# 3. Install SDK
npm install @sentry/react @sentry/tracing

# 4. Initialize in src/main.tsx
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: "https://YOUR_SENTRY_DSN@sentry.io/PROJECT_ID",
  integrations: [
    new BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: "production",
});
```

#### Configuration
- **Project Name:** Whale Tracker Frontend
- **Platform:** JavaScript / React
- **Alert Threshold:** Error rate >5% or 10 errors/min
- **Notification:** Slack #monitoring

#### Error Categories
- [ ] HTTP Errors (4xx, 5xx)
- [ ] JavaScript Errors
- [ ] API Failures
- [ ] WebSocket Disconnections
- [ ] Copy Trade Failures

---

### 2. Analytics: PostHog
**Status:** TO BE CONFIGURED

#### Setup Steps
```bash
# 1. Create PostHog account at https://posthog.com
# 2. Install SDK
npm install posthog-js

# 3. Initialize in src/main.tsx
import posthog from 'posthog-js'

posthog.init('YOUR_POSTHOG_API_KEY', {
  api_host: 'https://app.posthog.com',
  loaded: (ph) => {
    if (process.env.NODE_ENV === 'production') ph.identify(userId)
  }
})
```

#### Key Events to Track
- [ ] User Login (identify)
- [ ] Whale Profile View (view_whale)
- [ ] Copy Trade Created (copy_trade_created)
- [ ] Copy Trade Paused (copy_trade_paused)
- [ ] Copy Trade Cancelled (copy_trade_cancelled)
- [ ] Order Placed (order_placed)
- [ ] Order Executed (order_executed)

#### Custom Properties
```javascript
posthog.capture('copy_trade_created', {
  whale_id: whale.id,
  whale_roi: whale.roi,
  copy_percentage: 25,
  trades_count: 5,
  user_balance: 10000
})
```

---

### 3. Performance: Vercel Analytics + Web Vitals
**Status:** BUILT-IN

#### Configuration
```javascript
// Web Vitals in src/main.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log('Metric:', metric)
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

#### Core Web Vitals
- **LCP** (Largest Contentful Paint): Target <2.5s
- **FID** (First Input Delay): Target <100ms
- **CLS** (Cumulative Layout Shift): Target <0.1

---

## Alert Configuration

### Alert Rules

| Condition | Threshold | Severity | Action |
|-----------|-----------|----------|--------|
| Error Rate | >5% | Critical | Page, Slack |
| Page Load | >2s | High | Debug, Monitor |
| API Response | >500ms | Medium | Monitor, Log |
| WebSocket Disco | >1% | High | Debug, Monitor |
| Copy Trade Failure | >10% | Critical | Page, Slack |
| Database Slow | >1s | Medium | Alert, Log |
| Memory Leak | >80% | High | Investigate |
| Uptime Down | <99.9% | Critical | Page, Slack |

### Notification Channels
- **Critical:** PagerDuty + Slack #critical
- **High:** Slack #monitoring
- **Medium:** Email + Slack #alerts
- **Low:** Dashboard only

---

## Dashboards (To Be Created)

### Dashboard 1: Real-Time Health
**URL:** https://monitoring.whale-tracker.com/health

**Widgets:**
- [ ] Error rate (last 5 min)
- [ ] Page load time (p95)
- [ ] API response time (avg)
- [ ] WebSocket connections (active)
- [ ] Copy trade execution status
- [ ] Uptime percentage

### Dashboard 2: User Analytics
**URL:** https://monitoring.whale-tracker.com/analytics

**Widgets:**
- [ ] Daily Active Users (DAU)
- [ ] Copy trades created (daily)
- [ ] Most active whales
- [ ] Feature adoption %
- [ ] User retention (7-day)
- [ ] Top error sources

### Dashboard 3: Performance
**URL:** https://monitoring.whale-tracker.com/performance

**Widgets:**
- [ ] Core Web Vitals (LCP, FID, CLS)
- [ ] API latency breakdown
- [ ] Database query times
- [ ] Resource utilization
- [ ] Bandwidth usage
- [ ] Cache hit rate

---

## Runbook: Common Issues

### Issue: Error Rate Spike (>5%)
**Detection:** Sentry alert triggers
**Investigation:**
1. Check Sentry dashboard for error type
2. Look at recent code changes
3. Check API/database status
4. Review error stack traces

**Resolution:**
- [ ] Rollback if bad commit
- [ ] Scale up resources
- [ ] Fix bug and redeploy
- [ ] Monitor for 30 minutes

**Escalation:** If unresolved after 5 min → Page oncall

### Issue: Page Load Time >2s
**Detection:** Vercel Analytics or user reports
**Investigation:**
1. Check network waterfall in DevTools
2. Identify slow assets (JS, CSS, images)
3. Check API response times
4. Review CDN cache status

**Resolution:**
- [ ] Optimize asset size
- [ ] Enable compression
- [ ] Add caching headers
- [ ] Upgrade infrastructure

**Escalation:** If persists >15 min → Slack notification

### Issue: Copy Trade Failure Rate >10%
**Detection:** PostHog event analysis or Sentry tracking
**Investigation:**
1. Check copy-trades-api logs
2. Verify user balance/permissions
3. Check market liquidity
4. Review WebSocket connection status

**Resolution:**
- [ ] Increase retry attempts
- [ ] Improve error messages
- [ ] Scale copy trade service
- [ ] Add rate limiting

**Escalation:** If affecting >50% of trades → Critical alert

### Issue: WebSocket Disconnections
**Detection:** Sentry error tracking
**Investigation:**
1. Check WebSocket server logs
2. Review network connection patterns
3. Check token expiration
4. Monitor server CPU/memory

**Resolution:**
- [ ] Increase max connections
- [ ] Improve reconnection logic
- [ ] Add heartbeat mechanism
- [ ] Scale WebSocket server

**Escalation:** If affecting >1% of connections → Page oncall

---

## Maintenance Schedule

### Daily
- [ ] Check error dashboard (9am)
- [ ] Review overnight logs (8am)
- [ ] Verify uptime (daily status)

### Weekly
- [ ] Performance review meeting
- [ ] Analyze user analytics
- [ ] Review alert rules
- [ ] Check infrastructure scaling

### Monthly
- [ ] Full system audit
- [ ] Capacity planning
- [ ] Disaster recovery test
- [ ] Update runbooks

---

## Cost Estimation

| Service | Plan | Cost/Month | Seats |
|---------|------|-----------|-------|
| Sentry | Pro | $300 | 3 |
| PostHog | Cloud | $200 | 5 |
| Vercel | Pro | $150 | - |
| PagerDuty | Free | $0 | - |
| **Total** | | **$650** | |

---

## Success Criteria

- [ ] Sentry configured and capturing errors
- [ ] PostHog tracking key user events
- [ ] Vercel Analytics showing Web Vitals
- [ ] 3+ dashboards created
- [ ] Alert rules configured
- [ ] Runbook documented
- [ ] Team trained on monitoring

---

## Implementation Checklist

### Sentry
- [ ] Create Sentry project
- [ ] Add SDK to frontend
- [ ] Configure alert rules
- [ ] Link to Slack
- [ ] Test error capture

### PostHog
- [ ] Create PostHog account
- [ ] Install SDK
- [ ] Setup custom events
- [ ] Create dashboards
- [ ] Test event tracking

### Dashboards
- [ ] Health dashboard
- [ ] Analytics dashboard
- [ ] Performance dashboard
- [ ] Share with team

### Alerts
- [ ] Configure critical alerts
- [ ] Setup Slack channels
- [ ] Setup PagerDuty
- [ ] Test alert delivery

### Documentation
- [ ] Update runbooks
- [ ] Train team
- [ ] Schedule reviews
- [ ] Document escalation

---

**Status:** READY FOR IMPLEMENTATION
**Timeline:** March 10, 2026
**Owner:** DevOps / Ops Team
**Next Steps:** Execute implementation checklist
