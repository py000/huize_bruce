#!/bin/bash

# Fix white screen issue on VPS
# Run this on your VPS at /var/www/huize-bruce

set -e

APP_DIR="/var/www/huize-bruce"

echo "🔍 Diagnosing White Screen Issue"
echo "================================="
echo ""

cd "$APP_DIR"

# Step 1: Check current state
echo "1️⃣ Checking current state..."
echo "   Current directory: $(pwd)"
echo "   Git status:"
git status --short
echo ""

# Step 2: Clean and rebuild
echo "2️⃣ Cleaning and rebuilding..."
rm -rf dist node_modules/.vite
npm run build

# Step 3: Verify build
echo ""
echo "3️⃣ Verifying build..."
if [ ! -d "dist" ]; then
    echo "❌ dist folder not found!"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ dist/index.html not found!"
    exit 1
fi

echo "✅ Build files:"
ls -lh dist/
echo ""
echo "📄 index.html content (first 30 lines):"
head -30 dist/index.html
echo ""

# Step 4: Check asset paths in index.html
echo "4️⃣ Checking asset paths..."
if grep -q 'src="/assets' dist/index.html || grep -q 'href="/assets' dist/index.html; then
    echo "✅ Assets use absolute paths (good)"
else
    echo "⚠️  Assets might use relative paths"
    grep -E 'src=|href=' dist/index.html | head -3
fi
echo ""

# Step 5: Fix permissions
echo "5️⃣ Fixing permissions..."
sudo chown -R $USER:$USER "$APP_DIR"
sudo chmod -R 755 "$APP_DIR/dist"
echo "✅ Permissions fixed"
echo ""

# Step 6: Update Nginx config with proper SPA routing
echo "6️⃣ Updating Nginx configuration..."
sudo tee /etc/nginx/sites-available/huize-bruce > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name 57.131.25.225;
    
    root $APP_DIR/dist;
    index index.html;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # CRITICAL: SPA routing - must have try_files
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Don't cache HTML
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
    
    # Error handling
    error_page 404 /index.html;
}
EOF

# Step 7: Test and reload Nginx
echo "7️⃣ Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx config is valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx config error!"
    sudo nginx -t
    exit 1
fi

# Step 8: Check Nginx is serving correctly
echo ""
echo "8️⃣ Verifying Nginx setup..."
echo "   Nginx root directory:"
sudo nginx -T 2>/dev/null | grep "root" | grep huize-bruce
echo ""
echo "   Nginx status:"
sudo systemctl is-active nginx && echo "   ✅ Nginx is running" || echo "   ❌ Nginx is not running"
echo ""

# Step 9: Test locally on server
echo "9️⃣ Testing on server..."
if curl -s http://localhost | head -20 | grep -q "html\|root"; then
    echo "✅ Server responds with content"
else
    echo "⚠️  Server response:"
    curl -s http://localhost | head -5
fi
echo ""

echo "✅ Fix Complete!"
echo ""
echo "🌐 Your site: http://57.131.25.225"
echo ""
echo "🔧 If still white screen, check browser console (F12) for JavaScript errors"
echo "📋 Check Nginx logs: sudo tail -f /var/log/nginx/error.log"

