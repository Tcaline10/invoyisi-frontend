# InvoiceAI Backend

This is the backend API for the InvoiceAI application, built with FastAPI, SQLAlchemy, and PostgreSQL.

## Features

- User authentication with JWT and Supabase Auth
- Client management
- Invoice creation and management
- Payment tracking
- RESTful API design
- Database migrations with Alembic
- Integration with Supabase PostgreSQL
- Row-level security policies for data protection

## Project Structure

```
backend/
├── alembic/                  # Database migration files
├── app/                      # Main application package
│   ├── api/                  # API endpoints
│   │   ├── dependencies/     # API dependencies
│   │   └── endpoints/        # API route handlers
│   ├── core/                 # Core functionality
│   ├── db/                   # Database setup and session management
│   ├── models/               # SQLAlchemy models
│   ├── schemas/              # Pydantic schemas for request/response validation
│   ├── services/             # Business logic services
│   └── utils/                # Utility functions
├── .env                      # Environment variables (not in version control)
├── .gitignore                # Git ignore file
├── alembic.ini               # Alembic configuration
├── main.py                   # Application entry point
└── requirements.txt          # Python dependencies
```

## Getting Started

### Prerequisites

- Python 3.8+
- PostgreSQL (via Supabase)

### Supabase Setup

1. Run the complete setup script in the Supabase SQL Editor:
   - `supabase_complete_setup.sql` - Creates all database tables, RLS policies, and trigger functions in one go

2. This script will:
   - Drop any existing tables and policies to avoid conflicts
   - Create new tables with consistent data types (fixing any foreign key constraint issues)
   - Set up Row Level Security (RLS) policies for data protection
   - Create trigger functions for user management

3. Test your connection to Supabase:
   ```
   python test_supabase_connection.py
   ```

### Installation

1. Clone the repository
2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Set up environment variables in `.env` file:
   ```
   DATABASE_URL=postgresql://postgres:your_password@iwkwdhrrzndikkvdvgub.supabase.co:5432/postgres
   SUPABASE_URL=https://iwkwdhrrzndikkvdvgub.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3a3dkaHJyem5kaWtrdmR2Z3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNjgzMzAsImV4cCI6MjA2MDk0NDMzMH0.dSxMk3BoI7pmsxD_PfNXk6ufRt1gOOSwXFRJECe9QJE
   SECRET_KEY=your_secret_key_here
   ```
5. Run database migrations:
   ```
   alembic upgrade head
   ```
6. Start the server:
   ```
   uvicorn app.main:app --reload
   ```

### API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Migrations

To create a new migration after changing models:

```
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```
