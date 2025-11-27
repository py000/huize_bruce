# Step-by-Step VPS Deployment Guide

Follow these steps in order to deploy your website to your VPS.

## Prerequisites Checklist

- [ ] You have a VPS with SSH access
- [ ] You know your VPS IP address and username
- [ ] You have a GitHub account
- [ ] Your code is in a GitHub repository (or you're ready to push it)

---

## Step 1: Create GitHub Personal Access Token

1. Go to https://github.com and sign in
2. Click your profile picture (top right) → **Settings**
3. Scroll down to **Developer settings** (bottom left sidebar)
4. Click **Personal access tokens** → **Tokens (classic)**
5. Click **Generate new token** → **Generate new token (classic)**
6. Fill in:
   - **Note**: "VPS Deployment Token"
   - **Expiration**: Choose 90 days or custom
   - **Select scopes**: Check ✅ **repo** (Full control of private repositories)
7. Click **Generate token** at the bottom
8. **IMPORTANT**: Copy the token immediately (it looks like `ghp_xxxxxxxxxxxxx`) - you won't see it again!

✅ **You now have a GitHub token**

---

## Step 2: Connect to Your VPS

Open your terminal and SSH into your VPS:

```bash
ssh username@your-vps-ip
```

Replace:
- `username` with your VPS username (often `root` or `ubuntu`)
- `your-vps-ip` with your actual VPS IP address

Example: `ssh root@123.45.67.89`

✅ **You're now connected to your VPS**

---

## Step 3: Install Required Software on VPS

Run these commands on your VPS:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 or higher)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

Verify installations:
```bash
node --version  # Should show v18.x or higher
nginx -v        # Should show version
git --version   # Should show version
```

✅ **All software is installed**

---

## Step 4: Set Up GitHub Authentication

On your VPS, create and run the setup script. **Make sure you're in your home directory or /tmp:**

```bash
# Go to your home directory (you have full permissions here)
cd ~

# Create the script
cat > setup-github-token.sh << 'EOF'
#!/bin/bash
set -e

echo "🔐 GitHub Token Setup for VPS"
echo "=============================="
echo ""

if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Installing..."
    sudo apt update
    sudo apt install -y git
fi

read -p "Enter your GitHub username: " GITHUB_USERNAME
read -sp "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_USERNAME" ] || [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Username and token are required!"
    exit 1
fi

if [ -z "$(git config --global user.name)" ]; then
    read -p "Enter your name for Git commits: " GIT_NAME
    git config --global user.name "$GIT_NAME"
fi

if [ -z "$(git config --global user.email)" ]; then
    read -p "Enter your email for Git commits: " GIT_EMAIL
    git config --global user.email "$GIT_EMAIL"
fi

echo "📝 Configuring Git credential helper..."
git config --global credential.helper store

CREDENTIALS_FILE="$HOME/.git-credentials"
echo "https://${GITHUB_TOKEN}@github.com" > "$CREDENTIALS_FILE"
chmod 600 "$CREDENTIALS_FILE"

echo "✅ Credentials stored in $CREDENTIALS_FILE"
echo ""
echo "✅ Setup complete!"
EOF

# Make it executable (this is important!)
chmod +x setup-github-token.sh

# Verify it's executable
ls -l setup-github-token.sh

# Now run it
./setup-github-token.sh
```

**If you still get "permission denied", try:**

```bash
# Run with bash directly (doesn't require execute permission)
bash setup-github-token.sh
```

**Or use this alternative method (no file needed):**

```bash
# Run these commands directly (no script file needed)
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -sp "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
echo ""

git config --global credential.helper store
echo "https://${GITHUB_TOKEN}@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials

# Set Git user info (if not already set)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

echo "✅ GitHub authentication configured!"
```

When prompted:
- Enter your GitHub username
- Enter your GitHub token (paste it - it won't show on screen for security)
- Enter your name and email for Git commits

✅ **GitHub authentication is configured**

---

## Step 5: Clone Your Repository

On your VPS:

**⚠️ IMPORTANT: Don't use `sudo` with git clone!** Your GitHub credentials are stored for your user, not root.

```bash
# Create app directory
sudo mkdir -p /var/www/huize-bruce
sudo chown $USER:$USER /var/www/huize-bruce

# Navigate to it
cd /var/www/huize-bruce

# Clone your repository (REPLACE with your actual GitHub username and repo name!)
# Example: git clone https://github.com/johnsmith/my-app.git .
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git .

# If you get "fatal: destination path '.' already exists and is not an empty directory"
# Use this instead:
# git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git /var/www/huize-bruce
# cd /var/www/huize-bruce
```

**Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values!**

For example, if your GitHub username is `uliwintersperger` and your repo is `huize_bruce`, use:
```bash
git clone https://github.com/uliwintersperger/huize_bruce.git .
```

**If you're being asked for username/password:**
- Your credentials might not be set up correctly. Go back to Step 4 and run the authentication commands again.
- Make sure you're NOT using `sudo` when cloning.

✅ **Your code is now on the VPS**

---

## Step 6: Set Up Environment Variables (Optional - Skip This)

**You can skip this step!** GEMINI_API_KEY is not required for deployment.

If you need it later for your application to work, you can create it:

```bash
cd /var/www/huize-bruce

# Only if you need the API key
echo "GEMINI_API_KEY=your-actual-api-key-here" > .env.local
nano .env.local  # Edit with your actual API key
```

✅ **Skipping environment variables (not required)**

---

## Step 7: Build Your Application

On your VPS:

```bash
cd /var/www/huize-bruce

# Install dependencies
npm install

# Build the app
npm run build
```

This creates a `dist` folder with your built website.

✅ **Application is built**

---

## Step 8: Configure Nginx

On your VPS:

```bash
cd /var/www/huize-bruce

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/huize-bruce
```

Paste this configuration (press `Ctrl+Shift+V` to paste in nano):

```nginx
server {
    listen 80;
    listen [::]:80;
    
    # Replace with your domain or IP address
    server_name your-domain.com www.your-domain.com;
    # OR if no domain: server_name your-vps-ip;
    
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
    
    # Main location block
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

Save and exit: Press `Ctrl+X`, then `Y`, then `Enter`

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/huize-bruce /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

✅ **Nginx is configured**

---

## Step 9: Open Firewall Ports

On your VPS:

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall (if not already enabled)
sudo ufw enable
```

✅ **Firewall is configured**

---

## Step 10: Test Your Website

Open your web browser and visit:
- `http://your-vps-ip` (if using IP)
- `http://your-domain.com` (if using domain)

You should see your website! 🎉

---

## Step 11: Set Up SSL (Optional but Recommended)

If you have a domain name, set up HTTPS:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts
```

Your site will now be available at `https://your-domain.com`

✅ **SSL is configured**

---

## Step 12: Set Up Auto-Deployment (Optional)

Create a deployment script on your VPS:

```bash
cd /var/www/huize-bruce

cat > deploy-vps.sh << 'EOF'
#!/bin/bash
set -e

APP_DIR="/var/www/huize-bruce"
cd "$APP_DIR"

echo "📥 Pulling latest changes..."
git pull

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
EOF

chmod +x deploy-vps.sh
```

Now whenever you want to update your site:

```bash
cd /var/www/huize-bruce
./deploy-vps.sh
```

✅ **Auto-deployment is set up**

---

## 🎉 You're Done!

Your website is now live on your VPS!

### Quick Reference:

- **Update your site**: `cd /var/www/huize-bruce && ./deploy-vps.sh`
- **Check Nginx status**: `sudo systemctl status nginx`
- **View Nginx logs**: `sudo tail -f /var/log/nginx/error.log`
- **Restart Nginx**: `sudo systemctl restart nginx`

### Troubleshooting:

- **Can't access website**: Check firewall (`sudo ufw status`) and Nginx (`sudo systemctl status nginx`)
- **Build fails**: Check `.env.local` has correct `GEMINI_API_KEY`
- **Git pull fails**: Re-run `./setup-github-token.sh` to refresh token

---

## Next Steps:

- Set up automatic deployments with GitHub Actions
- Configure a custom domain
- Set up monitoring
- Add a backup strategy

Need help? Check the other guides:
- `GITHUB_SETUP.md` - Detailed GitHub token setup
- `DEPLOYMENT.md` - Full deployment documentation
- `TRANSFER_FILES.md` - How to transfer files to VPS

