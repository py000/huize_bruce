#!/bin/bash

# Complete deployment script - pulls latest from GitHub and deploys
# Run this on your VPS

set -e

APP_DIR="/var/www/huize-bruce"
REPO_URL="https://github.com/py000/huize_bruce.git"

echo "🚀 Deploying Latest Changes to VPS"
echo "==================================="
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
npm install

# Step 4: Build the application
echo ""
echo "🔨 Building application..."
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
echo "   Files in dist/: $(ls dist/ | wc -l) items"

# Step 5: Configure Nginx
echo ""
echo "🌐 Configuring Nginx..."

# Get VPS IP address
VPS_IP=$(hostname -I | awk '{print $1}')

# Create Nginx config
sudo tee /etc/nginx/sites-available/huize-bruce > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    
    # Using VPS IP - replace with your domain if you have one
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
    
    # Main location block - SPA routing support
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
    exit 1
fi

# Step 6: Configure firewall
echo ""
echo "🔥 Configuring firewall..."
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true

# Step 7: Verify deployment
echo ""
echo "🔍 Verifying deployment..."
if [ -f "$APP_DIR/dist/index.html" ]; then
    HTML_SIZE=$(wc -c < "$APP_DIR/dist/index.html")
    if [ "$HTML_SIZE" -gt 100 ]; then
        echo "✅ index.html exists and has content ($HTML_SIZE bytes)"
    else
        echo "⚠️  Warning: index.html seems too small"
    fi
else
    echo "❌ Error: index.html not found!"
fi

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Your website should be accessible at:"
echo "   http://$VPS_IP"
echo ""
echo "📋 Repository location: $APP_DIR"
echo "📁 Built files: $APP_DIR/dist"
echo "📦 Latest commit: $(git log -1 --oneline)"
echo ""
echo "🔄 To update in the future, just run this script again:"
echo "   ./deploy-to-vps.sh"
echo ""
echo "Or manually:"
echo "   cd $APP_DIR && git pull && npm install && npm run build && sudo systemctl reload nginx"

