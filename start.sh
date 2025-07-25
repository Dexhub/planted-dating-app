#!/bin/bash

echo "Starting Planted Dating App..."
echo "================================"

# Check if MongoDB is running
if ! pgrep -q mongod; then
    echo "Starting MongoDB..."
    mongod --fork --logpath /tmp/mongodb.log --dbpath /usr/local/var/mongodb
    sleep 2
fi

echo "MongoDB is running ✓"

# Start backend
echo "Starting backend server on port 5001..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend on port 5173..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "================================"
echo "✅ Planted is running!"
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:5173"
echo "================================"
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait