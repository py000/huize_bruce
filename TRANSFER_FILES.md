# How to Transfer Files to Your VPS

You need to get the deployment scripts onto your VPS. Here are several methods:

## Method 1: Using SCP (Recommended)

From your **local machine** (where you have the files):

```bash
# Transfer the setup script
scp setup-github-token.sh user@your-vps-ip:/tmp/

# Transfer the deployment script
scp deploy-vps.sh user@your-vps-ip:/tmp/

# Transfer Nginx config
scp nginx.conf user@your-vps-ip:/tmp/
```

Then SSH into your VPS and run:
```bash
cd /tmp
chmod +x setup-github-token.sh deploy-vps.sh
./setup-github-token.sh
```

## Method 2: Using the Transfer Script

From your **local machine**:

```bash
./transfer-to-vps.sh user@your-vps-ip
```

Replace `user@your-vps-ip` with your actual VPS credentials.

## Method 3: Copy-Paste (Quick Method)

If you can't use SCP, you can create the file directly on your VPS:

1. SSH into your VPS
2. Create the file:
   ```bash
   nano setup-github-token.sh
   ```
3. Copy the entire contents of `setup-github-token.sh` from your local machine
4. Paste into the nano editor
5. Save: `Ctrl+X`, then `Y`, then `Enter`
6. Make it executable: `chmod +x setup-github-token.sh`
7. Run it: `./setup-github-token.sh`

## Method 4: Using Git (If Repository is Already on GitHub)

If your code is already on GitHub:

```bash
# On your VPS
cd /tmp
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
chmod +x setup-github-token.sh deploy-vps.sh
./setup-github-token.sh
```

## Quick Copy-Paste for setup-github-token.sh

If you need to create it manually, here's the content:

```bash
cat > setup-github-token.sh << 'EOF'
#!/bin/bash

# GitHub Token Setup Script for VPS
# This script configures Git to use a GitHub Personal Access Token

set -e

echo "🔐 GitHub Token Setup for VPS"
echo "=============================="
echo ""

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Installing..."
    sudo apt update
    sudo apt install -y git
fi

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

# Get GitHub token (hidden input)
read -sp "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
echo ""

# Validate inputs
if [ -z "$GITHUB_USERNAME" ] || [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Username and token are required!"
    exit 1
fi

# Configure Git user (if not already set)
if [ -z "$(git config --global user.name)" ]; then
    read -p "Enter your name for Git commits: " GIT_NAME
    git config --global user.name "$GIT_NAME"
fi

if [ -z "$(git config --global user.email)" ]; then
    read -p "Enter your email for Git commits: " GIT_EMAIL
    git config --global user.email "$GIT_EMAIL"
fi

# Set up credential helper
echo "📝 Configuring Git credential helper..."
git config --global credential.helper store

# Store credentials securely
CREDENTIALS_FILE="$HOME/.git-credentials"
echo "https://${GITHUB_TOKEN}@github.com" > "$CREDENTIALS_FILE"
chmod 600 "$CREDENTIALS_FILE"

echo "✅ Credentials stored in $CREDENTIALS_FILE"

# Test connection
echo ""
echo "🧪 Testing GitHub connection..."
if git ls-remote "https://github.com/${GITHUB_USERNAME}" &> /dev/null; then
    echo "✅ Successfully connected to GitHub!"
else
    echo "⚠️  Could not verify connection. Token might be invalid or have insufficient permissions."
    echo "   Make sure your token has 'repo' scope for private repositories."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Clone your repository:"
echo "   git clone https://github.com/${GITHUB_USERNAME}/REPO_NAME.git"
echo ""
echo "2. Or update existing remote:"
echo "   git remote set-url origin https://github.com/${GITHUB_USERNAME}/REPO_NAME.git"
echo ""
echo "🔒 Security note: Your token is stored in $CREDENTIALS_FILE"
echo "   Keep this file secure and never share it!"
EOF

chmod +x setup-github-token.sh
```

Just copy and paste this entire block into your VPS terminal!

