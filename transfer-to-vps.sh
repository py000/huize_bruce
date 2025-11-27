#!/bin/bash

# Script to transfer deployment files to VPS
# Usage: ./transfer-to-vps.sh user@your-vps-ip

if [ -z "$1" ]; then
    echo "Usage: ./transfer-to-vps.sh user@your-vps-ip"
    echo "Example: ./transfer-to-vps.sh root@123.45.67.89"
    exit 1
fi

VPS_HOST="$1"
VPS_DIR="/tmp/huize-bruce-deploy"

echo "📤 Transferring files to VPS..."
echo "Target: $VPS_HOST:$VPS_DIR"
echo ""

# Create directory on VPS
ssh "$VPS_HOST" "mkdir -p $VPS_DIR"

# Transfer the setup script
echo "Transferring setup-github-token.sh..."
scp setup-github-token.sh "$VPS_HOST:$VPS_DIR/"

# Transfer deployment script
echo "Transferring deploy-vps.sh..."
scp deploy-vps.sh "$VPS_HOST:$VPS_DIR/"

# Transfer Nginx config
echo "Transferring nginx.conf..."
scp nginx.conf "$VPS_HOST:$VPS_DIR/"

echo ""
echo "✅ Files transferred!"
echo ""
echo "📋 Next steps on your VPS:"
echo "  cd $VPS_DIR"
echo "  chmod +x setup-github-token.sh deploy-vps.sh"
echo "  ./setup-github-token.sh"

