# Quick Start: VPS Deployment with GitHub

## 1. Create GitHub Token

1. GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with **repo** scope
3. Copy the token (you won't see it again!)

## 2. On Your VPS

```bash
# Install prerequisites
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# Set up GitHub authentication
# Upload setup-github-token.sh to your VPS, then:
chmod +x setup-github-token.sh
./setup-github-token.sh
# Enter your GitHub username and token when prompted

# Clone your repository
sudo mkdir -p /var/www/huize-bruce
sudo chown $USER:$USER /var/www/huize-bruce
cd /var/www/huize-bruce
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Configure environment
echo "GEMINI_API_KEY=your-key-here" > .env.local

# Build
npm install
npm run build

# Set up Nginx
sudo cp nginx.conf /etc/nginx/sites-available/huize-bruce
sudo nano /etc/nginx/sites-available/huize-bruce  # Edit server_name
sudo ln -s /etc/nginx/sites-available/huize-bruce /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 3. Deploy Updates

```bash
# Upload deploy-vps.sh to your VPS, then:
cd /var/www/huize-bruce
chmod +x deploy-vps.sh
./deploy-vps.sh
```

That's it! Your app should be live.

For detailed instructions, see:
- **[GITHUB_SETUP.md](GITHUB_SETUP.md)** - GitHub token setup
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Full deployment guide

