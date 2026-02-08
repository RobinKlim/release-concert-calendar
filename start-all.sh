#!/bin/bash

echo "🚀 Starting Release Concert Calendar..."
echo ""
echo "Starting backend on http://localhost:3000..."
cd backend && npm start &
BACKEND_PID=$!

echo "Waiting 3 seconds for backend to start..."
sleep 3

echo ""
echo "Starting frontend on http://localhost:4200..."
cd ../frontend && npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers starting!"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "📱 Open http://localhost:4200 in your browser"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait
