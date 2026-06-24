# Global InvestIQ (V1 Sandbox) - Implementation Summary

This document summarizes what was successfully implemented and what was explicitly skipped for the first version (V1) of the Global InvestIQ application. As requested, this version focuses strictly on foundational scaffolding and avoids implementing or dummying the highly complex logical features.

## 🟢 What Was Implemented

### 1. Infrastructure & Scaffolding
- **Docker Integration**: Created `docker-compose.yml` to orchestrate both the backend and frontend services.
- **Backend Dockerfile**: Set up a Python 3.11 environment to run the Django API.
- **Frontend Dockerfile**: Set up a Node.js 20 environment to run the Next.js frontend.
- **README.md**: Added instructions for running the stack via Docker or setting up a local Python virtual environment.

### 2. Backend (Django REST Framework)
- **Django Project Initialization**: Set up the core project (`config/`) and an `api/` app.
- **Database Models**: Created `NewsItem` and `EducationalArticle` models using SQLite.
- **REST APIs**: Built read-only API endpoints for serving Market News (`/api/news/`) and Educational Articles (`/api/articles/`).
- **CORS Configuration**: Integrated `django-cors-headers` to ensure the frontend can fetch data without cross-origin issues.

### 3. Frontend (Next.js + Tailwind CSS)
- **App Router & Tailwind**: Initialized Next.js with TypeScript and integrated Tailwind CSS.
- **Premium Dark Mode UI**: Designed a sleek, finance-oriented dark theme (`globals.css`) as the foundation.
- **Sidebar Layout**: Implemented a responsive sidebar navigation (`src/app/components/Sidebar.tsx`) connecting to the core pages.
- **Market News Page**: Retrieves news from the backend API. If the backend is unreachable or empty, it gracefully falls back to displaying mock 2020 news data so the UI remains demonstrable.
- **Learning Hub Page**: Displays educational articles formatted from backend data, specifically addressing Kenyan investor concerns (e.g., KSh to USD risks).

---

## 🔴 What Was Skipped

To adhere strictly to building a simple "first version" and avoiding complex features, the following components were completely omitted. I did **not** implement them nor create dummy versions:

- **`yfinance` 2020 Data Seeder**: The `seed_data.py` script for querying real historical 2020 stock data from the Yahoo Finance API was skipped. Building a robust data ingestion pipeline for historical data is complex.
- **Onboarding & Risk Advisor Quiz**: The dynamic questionnaire, the algorithm calculating historical returns based on risk tolerance, and the Recharts pie charts were skipped.
- **Portfolio Dashboard (Trading Engine)**: The core mechanics of the mock brokerage (starting with $10,000, buying at Jan 2020 prices, tracking net worth using Dec 2020 prices, and rendering interactive portfolio growth charts) were completely omitted.
- **Dividend Tracker**: Parsing historical dividend payout schedules and calculating exact cash yields based on hypothetical portfolio holdings was skipped.
- **Comprehensive Testing Suite**: Generating robust Django unit tests and Jest UI tests was deferred to future phases to prioritize getting the foundational code working.
