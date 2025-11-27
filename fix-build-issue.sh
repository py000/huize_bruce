#!/bin/bash

# Fix Vite build not processing entry point
# Run this on your VPS

set -e

cd /var/www/huize-bruce

echo "🔍 Diagnosing Build Issue"
echo "========================"
echo ""

# 1. Check if index.tsx exists
echo "1️⃣ Checking entry point..."
if [ -f "index.tsx" ]; then
    echo "✅ index.tsx exists"
    head -5 index.tsx
else
    echo "❌ index.tsx NOT FOUND!"
    exit 1
fi
echo ""

# 2. Check Vite version and config
echo "2️⃣ Checking Vite setup..."
npm list vite
echo ""

# 3. Clean everything
echo "3️⃣ Cleaning build artifacts..."
rm -rf dist .vite node_modules/.vite
echo "✅ Cleaned"
echo ""

# 4. Try building with verbose output
echo "4️⃣ Building with verbose output..."
npm run build 2>&1 | tee /tmp/vite-build.log

echo ""
echo "5️⃣ Checking build output..."
if [ -f "dist/index.html" ]; then
    echo "✅ dist/index.html exists"
    echo "   Script tags in built HTML:"
    grep -E '<script' dist/index.html || echo "   ⚠️  NO SCRIPT TAGS FOUND!"
else
    echo "❌ dist/index.html NOT FOUND!"
fi
echo ""

# 6. Check for errors in build log
echo "6️⃣ Checking for build errors..."
if grep -i "error\|fail" /tmp/vite-build.log; then
    echo "⚠️  Found errors in build log!"
else
    echo "✅ No obvious errors in build log"
fi
echo ""

# 7. Check what files were created
echo "7️⃣ Files created in dist:"
find dist -type f 2>/dev/null || echo "   No files found"
echo ""

# 8. Check the actual built HTML content
echo "8️⃣ Built index.html content:"
cat dist/index.html
echo ""

echo "✅ Diagnosis complete!"
echo "📋 Check /tmp/vite-build.log for full build output"

