#!/bin/bash

echo "🚀 Starting DXTI Delivery Service"
echo "=============================="

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start Backend
echo ""
echo "📦 Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:5000 (PID: $BACKEND_PID)"
cd ..

sleep 2

# Start Frontend
echo ""
echo "🎨 Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend running on http://localhost:5173 (PID: $FRONTEND_PID)"
cd ..

sleep 2

# Start Admin
echo ""
echo "🛠️  Starting Admin Panel..."
cd admin
npm run dev &
ADMIN_PID=$!
echo "✅ Admin running on http://localhost:5174 (PID: $ADMIN_PID)"
cd ..

echo ""
echo "=============================="
echo "🎉 All services are running!"
echo ""
echo "📦 Backend API:  http://localhost:5000"
echo "🌐 Frontend:     http://localhost:5173"
echo "🛠️  Admin Panel:  http://localhost:5174"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all processes
wait
