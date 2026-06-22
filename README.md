# Global InvestIQ (V1)

Global InvestIQ is an investment advisor and learning platform. This is the first version (V1) built on a simplified scaffolding without complex portfolio calculations or time-travel historical data seeding.

## Tech Stack
* **Backend:** Python, Django REST Framework, SQLite
* **Frontend:** Next.js (App Router), React, Tailwind CSS
* **Infrastructure:** Docker, Docker Compose

## Running Locally

### Using Docker Compose (Recommended)
You can run the entire application using Docker Compose:
```bash
docker-compose up --build
```
* Frontend: http://localhost:3000
* Backend API: http://localhost:8000

### Local Backend Development (Without Docker)
If you want to run the backend locally, you should use a Python virtual environment (`venv`).

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   * **Windows:** `venv\Scripts\activate`
   * **macOS/Linux:** `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the server:
   ```bash
   python manage.py runserver
   ```
