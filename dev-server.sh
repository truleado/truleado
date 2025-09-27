#!/bin/bash

# Development Server Script
echo "🚀 Starting Truleado Development Server..."

# Kill any existing processes on ports 3000-3002
echo "Cleaning up existing processes..."
for port in 3000 3001 3002; do
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "Killing process on port $port"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

# Wait a moment for processes to fully terminate
sleep 2

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Running setup..."
    ./setup-dev-env.sh
fi

# Start the development server
echo "Starting Next.js development server..."
echo "📍 Server will be available at: http://localhost:3000"
echo "🔄 If port 3000 is busy, it will use 3001 or 3002"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

# Start with specific port to avoid conflicts
PORT=3000 npm run dev
