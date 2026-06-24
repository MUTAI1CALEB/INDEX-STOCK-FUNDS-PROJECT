# Global InvestIQ - Change Log (Live Market Upgrade)

This document details all the architectural, backend, and frontend modifications made to transition the **Global InvestIQ** application from a static 2020 sandbox to a dynamic platform powered by live market data.

---

## 🟢 Core Backend Enhancements

### 1. Keyless Yahoo Finance Live Aggregator Fallback
* **File modified:** [market_data.py](file:///c:/Users/User/Documents/GitHub/INDEX-STOCK-FUNDS-PROJECT/backend/api/market_data.py)
* **Goal:** Moving away from a fixed 2020 sandbox without forcing local users to register for API keys.
* **Mechanism:** Updated the backend `FMPClient` to fall back to keyless public Yahoo Finance query APIs if `FMP_API_KEY` is not present in the environment:
  - **Live Quotes:** Fetched from the Yahoo Finance chart endpoint (`/v8/finance/chart/{ticker}?range=1d`). We extract the current trading price, previous close, and volume to calculate real-time gains/losses.
  - **Historical Prices:** Fetched from `/v8/finance/chart/{ticker}?range=90d&interval=1d` to supply Recharts with actual daily close arrays for the past 90 days.
  - **Market News:** Queried from the search API (`/v1/finance/search?q=market`) to ingest live macro articles.
  - **Dynamic Dividend Yield:** Dynamically divides the seeded trailing twelve months (TTM) annual dividend per share by the live market price, reflecting true market yield fluctuations.

---

## 🔵 Frontend Utility Modifications

### 1. persistence & Session Tracking
* **File modified:** [api.ts](file:///c:/Users/User/Documents/GitHub/INDEX-STOCK-FUNDS-PROJECT/frontend/src/utils/api.ts)
* **Goal:** Distinguish individual client sessions so multiple local browser tabs maintain isolated mock portfolios.
* **Mechanism:** Implemented `getSessionId()` to generate and save a client UUID in `localStorage` as `investiq_session_id`. Every fetch query automatically embeds this UUID in the `X-Session-ID` header, which the backend Django `SessionIDMiddleware` reads to map database records to the appropriate mock portfolio session.
* **New endpoints covered:**
  - `fetchDashboard()`: Ingests mock cash balances, holdings lists, and transactions.
  - `executeTrade()`: Submits simulated BUY/SELL actions on fractional quantities.
  - `fetchDividends()`: Gathers estimated annual dividend payouts.
  - `fetchMarketNews()`: Polls live global articles.
  - `fetchHistoricalData()`: Obtains 90-day charts.
  - `fetchQAEntries()`: Gathers Kenyan-focused Q&A listings.
  - `submitQuiz()`: Submits onboarding responses.

### 2. Assets List Update
* **File modified:** [mockData.ts](file:///c:/Users/User/Documents/GitHub/INDEX-STOCK-FUNDS-PROJECT/frontend/src/utils/mockData.ts)
* **Action:** Replaced the mock portfolio listings (Safaricom, Equity Bank, etc.) with the 10 curated global assets: `["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "VOO", "SPY", "V", "JPM", "KO"]`. Re-aligned the client-side `RISK_ALLOCATIONS` mappings to match the backend scoring models exactly.

---

## 🟣 UI Views & Integration Updates

### 1. Connected Live Dashboard & Trading Desk
* **File modified:** [page.tsx](file:///c:/Users/User/Documents/GitHub/INDEX-STOCK-FUNDS-PROJECT/frontend/src/app/page.tsx)
* **Updates:**
  - Removed local state calculations; all stats (Net Worth, cash, holdings, and gains/losses) are now synced directly from backend DRF endpoints.
  - Integrated fractional simulated trading (BUY/SELL) against live market prices.
  - Placed a live USD/KES currency lookup fetching from a keyless public currency API (`open.er-api.com`), allowing dynamic KSh equivalents to display alongside USD metrics.
  - Implemented a historical portfolio compiler that fetches 90-day price charts for all held assets and sums their value over time to plot a live performance chart using Recharts.

### 2. Connected Risk Quiz Page
* **File modified:** [page.tsx](file:///c:/Users/User/Documents/GitHub/INDEX-STOCK-FUNDS-PROJECT/frontend/src/app/quiz/page.tsx)
* **Updates:**
  - Re-aligned the three questionnaire questions to evaluate investment horizon (`timeline`), volatility reaction (`volatility_response`), and currency source (`income_source`) as required by the backend DRF serializer.
  - Connected the quiz finish action to `/api/onboarding/quiz/` to compute risk profile mappings and render recommended asset allocations directly.

### 3. Dual-Tab News & Kenyan Q&A Hub
* **File modified:** [page.tsx](file:///c:/Users/User/Documents/GitHub/INDEX-STOCK-FUNDS-PROJECT/frontend/src/app/news/page.tsx)
* **Updates:**
  - Created a dual-tab navigation.
  - **Tab 1:** Displays present-day live macro market news stories fetched dynamically from Yahoo Finance.
  - **Tab 2:** Renders an interactive, accordion-style Kenyan Q&A Advisory Desk fetched from the database, covering US double-taxation (30% withholding tax), Capital Gains Tax, KRA guidelines, and practical remittance advice.

### 4. Layout Branding Cleanup
* **Files modified:** [Sidebar.tsx](file:///c:/Users/User/Documents/GitHub/INDEX-STOCK-FUNDS-PROJECT/frontend/src/components/layout/Sidebar.tsx) and [Header.tsx](file:///c:/Users/User/Documents/GitHub/INDEX-STOCK-FUNDS-PROJECT/frontend/src/components/layout/Header.tsx)
* **Updates:**
  - Switched the Sidebar logo subheader from `2020 Sandbox` to `Live Markets`.
  - Replaced the `SANDBOX LOCK ACTIVE` warning banner with a clean, green `LIVE MARKET FEED ACTIVE` status feed.
  - Removed "Timeline: Full-Year 2020" in the top header and replaced it with a dynamic "Data Feed: Live Markets" globe indicator.
  - Integrated background syncs on header mount to pull user cash and risk values from the database on page loads where `localStorage` might be blank.
