# Global InvestIQ (Live V2 Upgrade)

Global InvestIQ is a premium, live-market investment advisor, real-time mock portfolio tracker, and educational academy specifically tailored for Kenyan investors looking to navigate global equities.

The application has been upgraded from a static sandbox to a dynamic system pulling present-day market rates and USD/KES currency values, fully certified with type-safety and ESLint compliance.

---

## 🚀 Key Features (V2 Upgrade)

### 1. Live Market Data Feed
- Real-time stock prices, 90-day daily histories, and dividend yields for **10 curated global assets**: `["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "VOO", "SPY", "V", "JPM", "KO"]`.
- Integrates a keyless public Yahoo Finance chart query API fallback aggregator, ensuring live pricing updates without requiring local API keys.
- Server-side caching in Django (SQLite-backed DatabaseCache) prevents rate limit issues during navigation.

### 2. Mock Portfolio Tracker & Trading Desk
- Initialize mock accounts with **$10,000 USD** cash balance.
- Execute simulated fractional **BUY** and **SELL** orders at real-time market prices.
- Live **USD to KES conversion lookup** utilizing keyless public exchange rate APIs (`open.er-api.com`) to display KSh portfolio equivalents dynamically.
- Interactive Recharts **Portfolio Growth Area Chart** plotting 90-day history.
- Real-time gain/loss tracker displaying color-coded percentages and indicators.

### 3. Risk Onboarding Advisor
- An interactive questionnaire evaluating investment horizon, volatility response, and currency exposure.
- Automates scoring logic mapping users to **Conservative**, **Moderate**, or **Aggressive** profiles.
- Visualizes asset weight recommendations using custom **Recharts Pie Charts**.

### 4. Localized Kenyan Q&A Hub & Learning Academy
- Database-persisted accordion desks explaining Kenyan-specific investing regulations (US 30% dividend withholding tax, W-8BEN forms, Capital Gains tax, and currency volatility hedging).
- Fully persistent learning guides persistence linked directly to Django backend models.

---

## 🛠️ Tech Stack
- **Backend:** Python 3.11+, Django, Django REST Framework, SQLite
- **Frontend:** Next.js 16 (App Router), React 19, Recharts, Lucide Icons, Tailwind CSS 4
- **Infrastructure:** Docker, Docker Compose

---

## ⚙️ How to Run Locally

### 1. Running via Docker Compose (Recommended)
Launch the entire frontend, backend, and database ecosystem in single-orchestrated containers:
```bash
docker compose up --build
```
* **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
* **Backend API Documentation**: [http://localhost:8000/api/schema/swagger-ui/](http://localhost:8000/api/schema/swagger-ui/)

---

### 2. Local Backend Development (Without Docker)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Set up your Python environment (Python 3.11+) and activate it:
   - **Windows:** `.\venv\bin\activate` (or activate your virtual environment)
   - **macOS/Linux:** `source venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations and compile the database cache:
   ```bash
   python manage.py migrate
   python manage.py createcachetable
   ```
5. Seed initial market news, educational articles, and Q&A entries:
   ```bash
   python manage.py seed_data
   ```
6. Start the development server:
   ```bash
   python manage.py runserver
   ```

---

### 3. Local Frontend Development (Without Docker)
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run ESLint checks:
   ```bash
   npm run lint
   ```
4. Run Next.js development server:
   ```bash
   npm run dev
   ```
