# VPS Deployment Guide

This guide will help you deploy your Vite React app to a VPS.

## Prerequisites

- A VPS with Ubuntu/Debian (or similar Linux distribution)
- SSH access to your VPS
- Node.js installed on your VPS (or use Docker)
- Nginx installed (for serving the static files)

## Option 1: Simple Nginx Deployment (Recommended)

### Step 1: Prepare Your VPS

SSH into your VPS and install required software:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 or higher)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Git (if not already installed)
sudo apt install -y git
```

### Step 2: Set Up GitHub Authentication

Before cloning, you need to authenticate with GitHub. See **[GITHUB_SETUP.md](GITHUB_SETUP.md)** for detailed instructions.

Quick setup:
```bash
# Upload setup-github-token.sh to your VPS, then:
chmod +x setup-github-token.sh
./setup-github-token.sh
```

### Step 3: Clone and Build Your App

```bash
# Create a directory for your app
sudo mkdir -p /var/www/huize-bruce
sudo chown $USER:$USER /var/www/huize-bruce

# Clone your repository (GitHub token should be configured)
cd /var/www/huize-bruce
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git .

# Install dependencies
npm install

# Set your environment variable
echo "GEMINI_API_KEY=your-api-key-here" > .env.local

# Build the app
npm run build
```

### Step 4: Configure Nginx

Copy the provided Nginx configuration:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/huize-bruce
sudo ln -s /etc/nginx/sites-available/huize-bruce /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site if needed
```

Edit the configuration to match your domain:

```bash
sudo nano /etc/nginx/sites-available/huize-bruce
```

Update the `server_name` directive with your domain or IP address.

### Step 5: Test and Reload Nginx

```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### Step 6: Set Up SSL (Optional but Recommended)

If you have a domain name, set up Let's Encrypt SSL:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Step 7: Set Up Auto-Deployment

Use the VPS deployment script that pulls from GitHub:

```bash
# Upload deploy-vps.sh to your VPS
chmod +x deploy-vps.sh

# Run deployment (pulls from GitHub, builds, and reloads Nginx)
./deploy-vps.sh
```

You can also set up a cron job for automatic deployments:

```bash
# Edit crontab
crontab -e

# Add this line to deploy every day at 2 AM (adjust as needed)
0 2 * * * /var/www/huize-bruce/deploy-vps.sh >> /var/log/huize-bruce-deploy.log 2>&1
```

## Option 2: Docker Deployment

### Step 1: Install Docker on VPS

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Step 2: Build and Run

```bash
# Build the Docker image
docker build -t huize-bruce .

# Run the container
docker run -d \
  --name huize-bruce \
  -p 80:80 \
  -e GEMINI_API_KEY=your-api-key-here \
  huize-bruce
```

## Option 3: PM2 with Vite Preview (Not Recommended for Production)

If you need to run the dev server:

```bash
# Install PM2
npm install -g pm2

# Set environment variable
export GEMINI_API_KEY=your-api-key-here

# Run with PM2
pm2 start npm --name "huize-bruce" -- run preview
pm2 save
pm2 startup
```

## Updating Your App

### Option 1: Using the Deployment Script (Recommended)

```bash
cd /var/www/huize-bruce
./deploy-vps.sh
```

This script will:
- Pull latest changes from GitHub
- Install/update dependencies
- Build the application
- Reload Nginx

### Option 2: Manual Update

```bash
cd /var/www/huize-bruce
git pull
npm install  # if dependencies changed
npm run build
sudo systemctl reload nginx
```

## Firewall Configuration

Make sure ports 80 and 443 are open:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Troubleshooting

- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check if Nginx is running: `sudo systemctl status nginx`
- Check if your app built correctly: `ls -la /var/www/huize-bruce/dist`
- Test Nginx config: `sudo nginx -t`

