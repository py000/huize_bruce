#!/bin/bash

# Script to start the calendar API server
# Run this on your VPS

cd /var/www/huize-bruce

echo "📅 Starting Calendar API Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    exit 1
fi

# Check if the API server file exists
if [ ! -f "calendar-api-server.js" ]; then
    echo "❌ calendar-api-server.js not found!"
    exit 1
fi

# Option 1: Install PM2 and use it (recommended)
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Start the API server with PM2
echo "🚀 Starting API server with PM2..."
pm2 start calendar-api-server.js --name calendar-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo ""
echo "✅ Calendar API server started!"
echo ""
echo "📋 Useful commands:"
echo "   pm2 list              - View running processes"
echo "   pm2 logs calendar-api - View logs"
echo "   pm2 restart calendar-api - Restart the server"
echo "   pm2 stop calendar-api - Stop the server"
echo ""
echo "🌐 API endpoint: http://localhost:3001/api/calendar/{person}.ics"
echo "   Example: http://localhost:3001/api/calendar/vera.ics"

