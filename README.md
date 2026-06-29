<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/layers.svg" alt="Postman Clone" width="80" height="80" />
  <h1>Postman Clone</h1>
  <p>A full-stack, highly scalable API testing client built with modern web technologies.</p>

  <div>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/SQLite-Database-003B57?style=flat-square&logo=sqlite" alt="SQLite" />
    <img src="https://img.shields.io/badge/Zustand-State-black?style=flat-square" alt="Zustand" />
    <img src="https://img.shields.io/badge/TailwindCSS-v3-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind" />
  </div>
</div>

---

## ✨ Features

- **Intuitive Request Builder**: Construct GET, POST, PUT, PATCH, and DELETE requests effortlessly.
- **Dynamic Variable Resolution**: Support for robust environment variables (e.g., `{{base_url}}/users`).
- **Comprehensive Request Management**: Organize your API calls using Workspaces, Collections, and Folders.
- **Execution History**: Maintain a persisted log of all your previous requests including response times, sizes, and status codes.
- **Pessimistic UI State**: The frontend uses an advanced data synchronization model that ensures the UI is always a true reflection of the backend database state.
- **Robust API Proxying**: The backend `RequestRunnerService` acts as a secure proxy, bypassing frontend CORS limitations, properly parsing JSON/binary responses, and tracking execution metrics.
- **Beautiful UI**: Modern, dark-mode native interface styled with Tailwind CSS, Shadcn UI, and Framer Motion micro-interactions.

## 🏗️ Architecture

This project strictly adheres to a **Clean Architecture** model, heavily decoupling the interface from the execution logic. 

### Frontend (Next.js 15, Zustand, Tailwind)
The frontend is designed as a "thin client". It does not execute requests or evaluate variables directly. Instead, it relies on Zustand to cache backend truths and provides an ultra-fast, optimistic-feeling (yet deeply pessimistic and accurate) user interface.

### Backend (FastAPI, SQLAlchemy 2.0, AsyncIO)
The backend is the engine of the application. 
- **API Layer**: Validates I/O boundaries using strict Pydantic V2 schemas.
- **Service Layer**: Houses all business logic. It handles the variable interpolation engine and coordinates the HTTPX client for outbound requests.
- **Repository Layer**: Exclusively focuses on database transactions and queries.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
# Activate virtual environment (Windows)
.\.venv\Scripts\Activate.ps1
# Install dependencies
pip install -r requirements.txt
# Run database migrations
alembic upgrade head
# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
# Start dev server
npm run dev
```

Visit `http://localhost:3000` to start crafting requests!

## 🧪 Testing

The backend is fully verified using `pytest`.

```bash
cd backend
pytest -v
```

## 🔒 Design Decisions & Security

- **Strict Validation**: All endpoints reject malformed data before hitting the service layer.
- **UUID Keys**: Prevents enumeration attacks by exposing `uuid` strings instead of auto-incrementing integer IDs.
- **Proxy Runner**: Running requests through the FastAPI backend avoids browser-enforced CORS restrictions and protects sensitive headers.
