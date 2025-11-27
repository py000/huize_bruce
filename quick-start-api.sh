#!/bin/bash

# Quick start script for calendar API
# Run this on your VPS

cd /var/www/huize-bruce

echo "📅 Starting Calendar API Server"
echo "================================"
echo ""

# Check if file exists
if [ ! -f "calendar-api-server.js" ]; then
    echo "❌ calendar-api-server.js not found!"
    echo "   Checking if it's in the repo..."
    ls -la calendar-api-server.js 2>&1
    echo ""
    echo "   Please pull from GitHub or create the file first."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Stop any existing instance
pm2 stop calendar-api 2>/dev/null || true
pm2 delete calendar-api 2>/dev/null || true

# Start the server
echo "🚀 Starting API server..."
pm2 start calendar-api-server.js --name calendar-api

# Wait a moment
sleep 2

# Check if it's running
if pm2 list | grep -q "calendar-api.*online"; then
    echo "✅ API server is running!"
    echo ""
    echo "🧪 Testing..."
    sleep 1
    curl -s http://localhost:3001/api/calendar/vera.ics | head -5
    echo ""
    echo ""
    echo "📋 Server status:"
    pm2 list
else
    echo "❌ Failed to start API server"
    echo ""
    echo "📋 Check logs:"
    pm2 logs calendar-api --lines 20
fi

