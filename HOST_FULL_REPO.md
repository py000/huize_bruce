# Host the Complete GitHub Repository on VPS

This guide will help you deploy your entire GitHub repository to your VPS.

## Quick Deploy (Automated)

### Option 1: Use the Deployment Script

1. **Transfer the script to your VPS:**

   From your local machine:
   ```bash
   scp deploy-full-repo.sh user@your-vps-ip:/tmp/
   ```

2. **Run on your VPS:**
   ```bash
   cd /tmp
   chmod +x deploy-full-repo.sh
   ./deploy-full-repo.sh
   ```

   The script will:
   - Clone/update your repository
   - Install dependencies
   - Build your application
   - Configure Nginx
   - Set up firewall
   - Deploy everything

### Option 2: Manual Step-by-Step

If you prefer to do it manually or the script doesn't work:

#### Step 1: Set Up Directory and Clone Repository

```bash
# Create directory
sudo mkdir -p /var/www/huize-bruce
sudo chown -R $USER:$USER /var/www/huize-bruce

# Navigate to it
cd /var/www/huize-bruce

# Clone the entire repository
git clone https://github.com/py000/huize_bruce.git .

# Verify all files are there
ls -la
```

#### Step 2: Set Up Environment Variables (Optional)

```bash
cd /var/www/huize-bruce

# Skip this step - GEMINI_API_KEY is not required for deployment
# If you need it later, you can create .env.local manually:
# echo "GEMINI_API_KEY=your-api-key-here" > .env.local
```

#### Step 3: Install Dependencies and Build

```bash
cd /var/www/huize-bruce

# Install all npm packages
npm install

# Build the application (creates dist folder)
npm run build

# Verify build succeeded
ls -la dist/
```

#### Step 4: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/huize-bruce
```

Paste this configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    
    # Get your VPS IP with: hostname -I
    server_name YOUR_VPS_IP;
    # Or use your domain: server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/huize-bruce/dist;
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
        try_files $uri $uri/ /index.html;
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
```

Save and exit (Ctrl+X, Y, Enter).

#### Step 5: Enable Site and Start Nginx

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/huize-bruce /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

#### Step 6: Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

#### Step 7: Test Your Website

Find your VPS IP:
```bash
hostname -I
```

Visit in your browser: `http://YOUR_VPS_IP`

---

## Verify Everything is Deployed

Check that all files from your repository are present:

```bash
cd /var/www/huize-bruce

# List all files
ls -la

# Check repository status
git status

# Verify build output
ls -la dist/

# Check Nginx is serving the right directory
sudo nginx -T | grep root
```

---

## Update Your Deployment

When you push changes to GitHub, update your VPS:

```bash
cd /var/www/huize-bruce

# Pull latest changes
git pull

# Reinstall dependencies (if package.json changed)
npm install

# Rebuild
npm run build

# Reload Nginx
sudo systemctl reload nginx
```

Or create a simple update script:

```bash
cat > /var/www/huize-bruce/update.sh << 'EOF'
#!/bin/bash
cd /var/www/huize-bruce
git pull
npm install
npm run build
sudo systemctl reload nginx
echo "✅ Updated!"
EOF

chmod +x /var/www/huize-bruce/update.sh
```

Then just run: `./update.sh`

---

## Troubleshooting

### Repository not found
- Make sure GitHub authentication is set up (see GITHUB_SETUP.md)
- Verify the repository URL is correct

### Build fails
- Check `.env.local` has correct `GEMINI_API_KEY`
- Run `npm install` again
- Check Node.js version: `node --version` (should be v18+)

### Website not accessible
- Check Nginx is running: `sudo systemctl status nginx`
- Check firewall: `sudo ufw status`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify dist folder exists: `ls -la /var/www/huize-bruce/dist`

### Permission errors
- Fix ownership: `sudo chown -R $USER:$USER /var/www/huize-bruce`
- Check file permissions: `ls -la /var/www/huize-bruce`

---

## File Structure on VPS

After deployment, your VPS will have:

```
/var/www/huize-bruce/
├── .git/                 # Git repository
├── .env.local            # Environment variables
├── package.json          # Dependencies
├── node_modules/         # Installed packages
├── dist/                 # Built website (served by Nginx)
│   ├── index.html
│   ├── assets/
│   └── ...
├── App.tsx               # Source files
├── components/
├── ...                   # All other repo files
└── update.sh            # Update script (if created)
```

Nginx serves only the `dist/` folder, but the entire repository is preserved for updates.

