#!/bin/bash

# Start the frontend in the background
echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

# Start the backend
echo "Starting backend..."
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Kill the frontend process when the backend is stopped
kill $FRONTEND_PID
