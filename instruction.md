# AI Agent Prompt: Global InvestIQ - Full Stack Live Market Generation

**Role:** You are a Principal Full-Stack Engineer. Your task is to complete and build out the core functional engines for "Global InvestIQ"—an investment advisor, real-time portfolio tracker, and educational platform tailored for Kenyan investors.

**Tech Stack:**
* **Backend:** Python, Django REST Framework (DRF), SQLite.
* **Frontend:** Next.js (App Router), React, Tailwind CSS, Recharts (for charts).
* **Infrastructure:** Docker, Docker Compose.

## ⚠️ Core Architectural Update: Real-Time Market Data Engine
We are moving away from a fixed 2020 sandbox. This application must reflect the state of **present-day global markets** using a live external financial API.
* **Data Integration:** The backend Django API must fetch current asset prices, historical price charts, and performance metrics dynamically using a free tier financial market API (e.g., **Alpha Vantage**, **Financial Modeling Prep**, or **Finnhub.io**).
* **Caching Layer:** To prevent hitting free tier rate limits during user navigation and presentation loops, implement a lightweight server-side cache in Django (using Django's built-in database/file caching) to store live stock quotes for 5–10 minutes before polling the external API again.
* **Curated Asset List:** The platform will support trading and tracking across these 10 core global instruments: `["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "VOO", "SPY", "V", "JPM", "KO"]`.

## Key Features to Implement (Phase 2 Core Build)
You must implement the complex logical engines that were skipped in Version 1:

1. **Onboarding & Risk Advisor Quiz:** Implemented as an interactive 3-question client questionnaire evaluating timeline, market volatility response, and currency sources. The backend must ingest these answers, map the user to a profile (`CONSERVATIVE`, `MODERATE`, `AGGRESSIVE`), and dynamically return a targeted asset allocation pie chart built via **Recharts** on the frontend.
2. **Live Portfolio Dashboard (Trading Engine):** Users are initialized with a mock cash balance of `$10,000 USD`. They can simulate "BUY" and "SELL" actions on any of the 10 curated tickers. Transactions must execute against **real-time market prices fetched via your API integration**. The dashboard must calculate and display fluctuating portfolio value, total capital gains/losses, and interactive historical performance lines using Recharts.
3. **Dynamic Dividend Tracker:** Calculate an estimated annual dividend payout cash yield based on the user's active simulated stock quantities and the trailing twelve months (TTM) dividend metrics fetched dynamically from the market data API.
4. **Market News & Localized Q&A Hub:** A dual feed. One tab fetches live macro market news from the external financial API. The second tab renders a hardcoded, populated Q/A section focused on Kenyan concerns (e.g., explaining the 30% US withholding tax on foreign dividends, currency volatility from KSh to USD).
5. **Learning Hub Data Persistence:** Fully connect the Next.js Learning Hub page to read from the Django SQLite database (`EducationalArticle` model) instead of using frontend text fallback buffers.

## Execution Instructions for the AI Agent
Please build upon the existing Docker, Django API scaffolding, and Next.js layout structure. Do not overwrite the current Sidebar or core UI theme configurations. 
* **Backend:** Build out the missing `UserProfile`, `Portfolio`, `AssetHolding`, and `Transaction` database models. Write DRF view endpoints for `/api/onboarding/quiz/`, `/api/portfolio/dashboard/`, and `/api/portfolio/trade/`.
* **Frontend:** Build and link the dynamic dashboard layout screens, input forms for buying/selling mock shares, the quiz layout tracking step states, and fully bind them to the new backend endpoints.