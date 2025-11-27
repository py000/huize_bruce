#!/bin/bash

# Deployment script for VPS at 57.131.25.225
# Run this ON your VPS (SSH into ubuntu@57.131.25.225 first)

set -e

APP_DIR="/var/www/huize-bruce"
REPO_URL="https://github.com/py000/huize_bruce.git"
VPS_IP="57.131.25.225"

echo "🚀 Deploying to VPS: $VPS_IP"
echo "============================"
echo ""

# Step 1: Setup directory
echo "📁 Setting up directory..."
sudo mkdir -p "$APP_DIR"
sudo chown -R $USER:$USER "$APP_DIR"
cd "$APP_DIR"

# Step 2: Clone or pull latest from GitHub
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes from GitHub..."
    git fetch origin
    git pull origin main || git pull origin master
    echo "✅ Repository updated"
else
    echo "📥 Cloning repository from GitHub..."
    git clone "$REPO_URL" .
    echo "✅ Repository cloned"
fi

# Step 3: Install/update dependencies
echo ""
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    npm install
fi

# Step 4: Build the application
echo ""
echo "🔨 Building application..."
rm -rf dist
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed! dist directory not found."
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed! dist/index.html not found."
    exit 1
fi

echo "✅ Build successful!"
echo "   Files in dist/: $(ls -1 dist/ | wc -l) items"
echo "   index.html size: $(wc -c < dist/index.html) bytes"

# Step 5: Fix permissions
echo ""
echo "🔐 Fixing permissions..."
sudo chown -R $USER:$USER "$APP_DIR"
sudo chmod -R 755 "$APP_DIR/dist"

# Step 6: Configure Nginx
echo ""
echo "🌐 Configuring Nginx..."

# Create Nginx config
sudo tee /etc/nginx/sites-available/huize-bruce > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    
    server_name $VPS_IP;
    
    root $APP_DIR/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Main location block - SPA routing support (IMPORTANT!)
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Don't cache HTML files
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }
    
    # Error pages
    error_page 404 /index.html;
}
EOF

# Enable the site
echo "🔗 Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/huize-bruce /etc/nginx/sites-enabled/

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx configuration test failed!"
    sudo nginx -t
    exit 1
fi

# Step 7: Configure firewall
echo ""
echo "🔥 Configuring firewall..."
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true

# Step 8: Verify everything
echo ""
echo "🔍 Verifying deployment..."
echo "   Nginx status:"
sudo systemctl is-active nginx && echo "   ✅ Nginx is running" || echo "   ❌ Nginx is not running"

echo "   Files:"
ls -lh "$APP_DIR/dist/index.html" 2>/dev/null && echo "   ✅ index.html exists" || echo "   ❌ index.html missing"

echo "   Nginx root:"
sudo nginx -T 2>/dev/null | grep "root" | head -1

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Your website should be accessible at:"
echo "   http://$VPS_IP"
echo ""
echo "📋 Repository location: $APP_DIR"
echo "📁 Built files: $APP_DIR/dist"
echo "📦 Latest commit: $(git log -1 --oneline 2>/dev/null || echo 'N/A')"
echo ""
echo "🔧 Troubleshooting commands:"
echo "   Check Nginx: sudo systemctl status nginx"
echo "   Check logs: sudo tail -f /var/log/nginx/error.log"
echo "   Check files: ls -la $APP_DIR/dist/"
echo "   Test config: sudo nginx -t"

