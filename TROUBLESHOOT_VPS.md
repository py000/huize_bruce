# Troubleshooting Blank Page on VPS (57.131.25.225)

## Quick Fix - Run This on Your VPS

SSH into your VPS first:
```bash
ssh ubuntu@57.131.25.225
```

Then run the deployment script:
```bash
# Copy and paste this entire block
cat > /tmp/deploy.sh << 'EOF'
#!/bin/bash
set -e

APP_DIR="/var/www/huize-bruce"
REPO_URL="https://github.com/py000/huize_bruce.git"

echo "🚀 Deploying to VPS..."

# Setup
sudo mkdir -p "$APP_DIR"
sudo chown -R $USER:$USER "$APP_DIR"
cd "$APP_DIR"

# Pull latest
if [ -d ".git" ]; then
    git pull origin main
else
    git clone "$REPO_URL" .
fi

# Install and build
npm install
rm -rf dist
npm run build

# Verify build
if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Fix permissions
sudo chown -R $USER:$USER "$APP_DIR"
sudo chmod -R 755 "$APP_DIR/dist"

# Configure Nginx
sudo tee /etc/nginx/sites-available/huize-bruce > /dev/null <<NGINX
server {
    listen 80;
    server_name 57.131.25.225;
    root $APP_DIR/dist;
    index index.html;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

# Enable and reload
sudo ln -sf /etc/nginx/sites-available/huize-bruce /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo ufw allow 80/tcp 2>/dev/null || true

echo "✅ Done! Visit: http://57.131.25.225"
EOF

chmod +x /tmp/deploy.sh
/tmp/deploy.sh
```

## Manual Troubleshooting Steps

### 1. Check if dist folder exists and has content

```bash
cd /var/www/huize-bruce
ls -la dist/
cat dist/index.html | head -30
```

### 2. Check Nginx configuration

```bash
# View current config
sudo cat /etc/nginx/sites-available/huize-bruce

# Check if it's enabled
ls -la /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t
```

### 3. Check Nginx is running

```bash
sudo systemctl status nginx
sudo systemctl restart nginx
```

### 4. Check Nginx error logs

```bash
sudo tail -50 /var/log/nginx/error.log
```

### 5. Check file permissions

```bash
ls -la /var/www/huize-bruce/dist/
sudo chown -R $USER:$USER /var/www/huize-bruce
sudo chmod -R 755 /var/www/huize-bruce/dist
```

### 6. Rebuild from scratch

```bash
cd /var/www/huize-bruce

# Clean everything
rm -rf node_modules dist

# Pull latest
git pull origin main

# Reinstall and rebuild
npm install
npm run build

# Verify
ls -la dist/
cat dist/index.html | head -20

# Reload Nginx
sudo systemctl reload nginx
```

### 7. Check if port 80 is open

```bash
sudo ufw status
sudo netstat -tlnp | grep :80
```

### 8. Test with a simple HTML file

```bash
echo "<h1>Test Works!</h1>" | sudo tee /var/www/huize-bruce/dist/test.html
# Visit: http://57.131.25.225/test.html
```

If test.html works but index.html doesn't, it's a routing/SPA issue.

## Common Issues and Fixes

### Issue: Blank page
**Fix:** Make sure Nginx config has `try_files $uri $uri/ /index.html;` for SPA routing

### Issue: 404 errors
**Fix:** Check that `root` in Nginx config points to `/var/www/huize-bruce/dist`

### Issue: Permission denied
**Fix:** Run `sudo chown -R $USER:$USER /var/www/huize-bruce`

### Issue: Build fails
**Fix:** Check Node.js version: `node --version` (should be v18+)

### Issue: Nginx not serving files
**Fix:** Check Nginx error logs and verify the dist folder exists

## Verify Deployment

After running the script, verify:

```bash
# 1. Check build output
ls -la /var/www/huize-bruce/dist/

# 2. Check Nginx is serving correct directory
sudo nginx -T | grep "root"

# 3. Check Nginx status
sudo systemctl status nginx

# 4. Test locally on server
curl http://localhost
```

If curl works but browser doesn't, it's a firewall issue.

