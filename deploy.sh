#!/bin/bash

# Deployment script for VPS
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Warning: .env.local not found. Make sure to set GEMINI_API_KEY"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed! dist directory not found."
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the dist folder to your VPS: /var/www/huize-bruce/dist"
echo "2. Make sure Nginx is configured (see nginx.conf)"
echo "3. Reload Nginx: sudo systemctl reload nginx"
echo ""
echo "Or if you're already on the VPS, run:"
echo "  sudo systemctl reload nginx"

