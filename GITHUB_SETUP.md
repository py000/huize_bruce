# GitHub Token Setup for VPS

This guide will help you connect your VPS to GitHub using a Personal Access Token (PAT) for secure repository access.

## Step 1: Create a GitHub Personal Access Token

1. Go to GitHub.com and sign in
2. Click your profile picture → **Settings**
3. Scroll down to **Developer settings** (bottom left)
4. Click **Personal access tokens** → **Tokens (classic)**
5. Click **Generate new token** → **Generate new token (classic)**
6. Give it a name (e.g., "VPS Deployment Token")
7. Set expiration (recommended: 90 days or custom)
8. Select scopes:
   - ✅ **repo** (Full control of private repositories) - Required for private repos
   - ✅ **read:packages** (if you use GitHub Packages)
9. Click **Generate token**
10. **IMPORTANT**: Copy the token immediately - you won't see it again!

## Step 2: Configure Git on Your VPS

### Option A: Using the Setup Script (Recommended)

1. Upload `setup-github-token.sh` to your VPS
2. Make it executable: `chmod +x setup-github-token.sh`
3. Run it: `./setup-github-token.sh`
4. Enter your GitHub username and token when prompted

### Option B: Manual Setup

SSH into your VPS and run:

```bash
# Configure Git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Store credentials using credential helper
git config --global credential.helper store

# Clone your repository using token
cd /var/www/huize-bruce
git clone https://YOUR_TOKEN@github.com/USERNAME/REPO_NAME.git .

# Or if repository already exists, update remote URL:
cd /var/www/huize-bruce
git remote set-url origin https://YOUR_TOKEN@github.com/USERNAME/REPO_NAME.git
```

**Note**: Replace:
- `YOUR_TOKEN` with your GitHub Personal Access Token
- `USERNAME` with your GitHub username
- `REPO_NAME` with your repository name

## Step 3: Secure Token Storage (Recommended)

Instead of embedding the token in the URL, use Git credential helper:

```bash
# Create a credentials file
echo "https://YOUR_TOKEN@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials

# Configure Git to use it
git config --global credential.helper store

# Now you can clone/pull without token in URL
git clone https://github.com/USERNAME/REPO_NAME.git
```

## Step 4: Test the Connection

```bash
cd /var/www/huize-bruce
git pull
```

If it works without asking for credentials, you're all set!

## Step 5: Update Deployment Script

The `deploy-vps.sh` script now includes automatic git pull. Make sure your token is configured before running it.

## Security Best Practices

1. **Never commit tokens to Git** - They're already in `.gitignore`
2. **Use fine-grained tokens** if available (GitHub's newer token type)
3. **Set token expiration** - Rotate tokens regularly
4. **Limit token scope** - Only grant necessary permissions
5. **Use environment variables** for tokens in scripts
6. **Restrict VPS access** - Use SSH keys, not passwords

## Troubleshooting

### "Authentication failed" error
- Verify your token hasn't expired
- Check that token has `repo` scope
- Ensure username and token are correct

### "Repository not found" error
- Verify repository name is correct
- Check if repository is private (token needs `repo` scope)
- Ensure token has access to the repository

### Token in URL visible in process list
- Use credential helper instead (see Step 3)
- Consider using SSH keys instead of HTTPS

## Alternative: SSH Key Authentication

If you prefer SSH keys over tokens:

```bash
# Generate SSH key on VPS
ssh-keygen -t ed25519 -C "vps-deployment"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
# Then clone using SSH:
git clone git@github.com:USERNAME/REPO_NAME.git
```

