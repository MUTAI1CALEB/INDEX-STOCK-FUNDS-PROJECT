# AI Agent Prompt: Global InvestIQ - Full Stack Generation

**Role:** You are a Principal Full-Stack Engineer. Your task is to generate the complete codebase for "Global InvestIQ", an investment advisor, portfolio tracker, and educational platform tailored for Kenyan investors.

**Tech Stack:**
* **Backend:** Python, Django REST Framework (DRF), SQLite.
* **Frontend:** Next.js (App Router), React, Tailwind CSS, Recharts (for charts).
* **Infrastructure:** Docker, Docker Compose.

## ⚠️ Core Architectural Constraint: The "2020 Time-Travel Sandbox"
To avoid live API rate limits and complex data pipelines, this entire application runs as a historical sandbox locked to the year 2020. 
* All stock prices, portfolio valuations, and dividend calculations must strictly reference data between **Jan 2, 2020** and **Dec 31, 2020**.
* You must write a backend Python script (`seed_data.py`) that uses the `yfinance` library to fetch and save this 2020 data into the SQLite database on startup. Do not make live API calls from the Next.js frontend.

## Key Features to Implement
Please design and implement the following features, handling the necessary UI, API endpoints, and database models yourself:

1.  **Onboarding & Risk Advisor:** A 3-question quiz to determine risk tolerance (Conservative, Moderate, Aggressive). The backend should return a recommended asset allocation based on 2020 historical performance, which the frontend displays as a pie chart.
2.  **Portfolio Dashboard:** A mock brokerage view. Users start with $10,000 mock cash. They can "buy" stocks (e.g., AAPL, MSFT, VOO) at their Jan 2020 prices. The dashboard should display their ending net worth (Dec 2020 prices) and percentage growth using charts.
3.  **Dividend Tracker:** Calculate and display the exact cash dividend yield the user would have received based on the total 2020 dividend payouts for the assets they hold.
4.  **Market News & AGMs:** A simple feed of mock 2020 news and Annual General Meeting summaries for the tracked companies.
5.  **Learning Hub:** A section with educational markdown articles specifically addressing Kenyan investor concerns (e.g., KSh to USD currency risks, US withholding taxes, basics of index funds).

## Execution Instructions for the AI Agent
Please execute the generation in the following phases. Use modern best practices, clean directory structures, and proper error handling. 

* **Phase 1: Project Scaffolding:** Create the root folder, `backend/` folder, and `frontend/` folder. Create the `docker-compose.yml` to orchestrate everything.
* **Phase 2: Backend Setup:** Initialize the Django project. **Provide instructions in the README to use a Python `venv` for local backend development.** Set up the SQLite database models, the DRF views/serializers, and the `seed_data.py` script.
* **Phase 3: Frontend Setup:** Initialize the Next.js application. Create a high-quality dark-mode financial dashboard UI. Ensure all frontend components communicate cleanly with the DRF API. 
* **Phase 4: Testing:** Write comprehensive test cases. Generate Django unit tests for the backend (testing the portfolio math and API endpoints) and standard Jest/React Testing Library tests for the frontend UI.
* **Phase 5: Containerization:** Provide fully working `Dockerfile`s for both backend and frontend, ensuring the backend runs migrations and the seeder script on boot.

Please generate the code now, starting with the file structure, environment setup, and backend models.