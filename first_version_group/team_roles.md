# Global InvestIQ - Team Work Breakdown

Since this project is to be developed by a group of **5 members**, here is a recommended breakdown of roles and responsibilities. This division ensures that the "very complicated" features remaining for V2 (like the 2020 time-travel sandbox, portfolio calculations, and testing) are evenly distributed.

---

## 1. Frontend Lead (Architecture & UI/UX)
**Primary Focus:** Setting up the Next.js foundation and ensuring a premium user experience.
* **Responsibilities:**
  * Configure Next.js App Router, Tailwind CSS, and global styles (Dark Mode).
  * Design and implement the core layout (Sidebar, Navbar, responsive design).
  * Build the **Learning Hub** and **Market News** pages.
  * Define the frontend folder structure and component guidelines.
* **Key Skills:** React, Next.js, CSS/Tailwind, UI/UX Design.

## 2. Frontend Developer (Data Visualization & Interactions)
**Primary Focus:** Building the complex, interactive features of the frontend.
* **Responsibilities:**
  * Build the **Onboarding & Risk Advisor** interactive 3-question quiz UI.
  * Integrate **Recharts** to display the asset allocation pie charts.
  * Build the **Portfolio Dashboard** UI (displaying mock cash, buying/selling interface, and portfolio growth charts).
  * Handle API integration (fetching data from the Django backend).
* **Key Skills:** React, Recharts, State Management, API Consumption.

## 3. Backend Lead (Django & API Architecture)
**Primary Focus:** Core database architecture and REST APIs.
* **Responsibilities:**
  * Set up the Django project, Django REST Framework, and SQLite database.
  * Design the core models: `User`, `Portfolio`, `Transaction`, `NewsItem`, and `EducationalArticle`.
  * Build the REST APIs for the frontend to consume (news feed, articles, executing trades).
  * Implement backend validation for the $10,000 mock cash constraint.
* **Key Skills:** Python, Django, REST APIs, Database Design.

## 4. Backend Developer / Data Engineer
**Primary Focus:** The "2020 Time-Travel Sandbox" and complex financial logic.
* **Responsibilities:**
  * Write the `seed_data.py` script to fetch historical 2020 data using the `yfinance` library.
  * Ensure the database is populated with accurate Jan-Dec 2020 prices.
  * Write the backend logic for the **Dividend Tracker** (calculating exact cash yields based on 2020 payouts).
  * Implement the backend algorithm that maps the Risk Advisor quiz answers to specific asset allocations.
* **Key Skills:** Python, Data Engineering (`yfinance`, pandas), Financial Math.

## 5. DevOps & QA Engineer
**Primary Focus:** Infrastructure, testing, and project documentation.
* **Responsibilities:**
  * Manage the `docker-compose.yml` and `Dockerfile`s to ensure the app runs seamlessly for all team members.
  * Ensure the backend `seed_data.py` script runs correctly on container startup.
  * Write **Django Unit Tests** to verify the portfolio math and time-travel logic.
  * Write **Jest / React Testing Library** tests for the frontend components.
  * Manage the GitHub repository (PR reviews, branch management).
* **Key Skills:** Docker, Testing (Jest, PyTest/Django Test), Git/GitHub.
