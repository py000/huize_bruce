#!/bin/bash

# VPS Deployment Script with GitHub Integration
# This script pulls from GitHub, builds, and deploys the application

set -e  # Exit on error

# Configuration
APP_DIR="/var/www/huize-bruce"
REPO_URL=""  # Will be detected from git remote if already cloned
BRANCH="main"  # Change to your default branch if different

echo "🚀 Starting VPS Deployment..."
echo "=============================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "⚠️  Warning: Running as root. Consider using a regular user with sudo."
fi

# Navigate to app directory
if [ ! -d "$APP_DIR" ]; then
    echo "📁 Creating app directory: $APP_DIR"
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
fi

cd "$APP_DIR"

# Check if it's a git repository
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes from GitHub..."
    
    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "$BRANCH")
    
    # Pull latest changes
    git fetch origin
    git reset --hard origin/$CURRENT_BRANCH
    git pull origin $CURRENT_BRANCH
    
    echo "✅ Code updated!"
else
    echo "❌ Not a git repository!"
    echo "   Please clone your repository first:"
    echo "   git clone https://github.com/USERNAME/REPO_NAME.git $APP_DIR"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found!"
    echo "   Creating template file..."
    echo "GEMINI_API_KEY=your-api-key-here" > .env.local
    echo "   Please edit .env.local and set your GEMINI_API_KEY"
    read -p "Press Enter to continue after setting GEMINI_API_KEY..."
fi

# Install/update dependencies
echo ""
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    npm install  # This will update if package.json changed
fi

# Build the application
echo ""
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed! dist directory not found."
    exit 1
fi

echo "✅ Build successful!"

# Reload Nginx if it's installed and configured
if command -v nginx &> /dev/null; then
    echo ""
    echo "🔄 Reloading Nginx..."
    if sudo nginx -t &> /dev/null; then
        sudo systemctl reload nginx
        echo "✅ Nginx reloaded!"
    else
        echo "⚠️  Nginx configuration test failed. Skipping reload."
    fi
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app should be live at your configured domain/IP"
echo "📝 Check logs: sudo tail -f /var/log/nginx/error.log"

