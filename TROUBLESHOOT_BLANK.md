# Troubleshooting Blank Website

If your website shows a blank page, follow these steps:

## Quick Checks

### 1. Check if dist folder exists and has files

```bash
cd /var/www/huize-bruce
ls -la dist/
```

You should see:
- `index.html`
- `assets/` folder with JS and CSS files

### 2. Check Nginx is serving the right directory

```bash
# Check Nginx config
sudo nginx -T | grep -A 5 "root"

# Should show: root /var/www/huize-bruce/dist;
```

### 3. Check browser console for errors

- Open your browser's Developer Tools (F12)
- Go to Console tab
- Look for red errors
- Go to Network tab - check if files are loading (404 errors?)

### 4. Check Nginx error logs

```bash
sudo tail -f /var/log/nginx/error.log
```

### 5. Verify the build was successful

```bash
cd /var/www/huize-bruce
cat dist/index.html
```

Should show HTML content, not be empty.

## Common Fixes

### Fix 1: Rebuild the application

```bash
cd /var/www/huize-bruce
npm run build
ls -la dist/
```

### Fix 2: Check file permissions

```bash
sudo chown -R $USER:$USER /var/www/huize-bruce
sudo chmod -R 755 /var/www/huize-bruce/dist
```

### Fix 3: Check Nginx configuration

```bash
# View current config
sudo cat /etc/nginx/sites-available/huize-bruce

# Make sure root points to /var/www/huize-bruce/dist
```

### Fix 4: Check if index.html exists

```bash
cat /var/www/huize-bruce/dist/index.html | head -20
```

If it's empty or missing, rebuild:
```bash
cd /var/www/huize-bruce
rm -rf dist
npm run build
```

### Fix 5: Check asset paths

The issue might be with asset paths. Check the index.html:

```bash
grep -i "src=\|href=" /var/www/huize-bruce/dist/index.html
```

Assets should start with `/` or be relative paths.

### Fix 6: Test with a simple file

```bash
# Create a test file
echo "<h1>It works!</h1>" | sudo tee /var/www/huize-bruce/dist/test.html

# Visit: http://YOUR_VPS_IP/test.html
```

If test.html works but index.html doesn't, it's a routing/SPA issue.

## Complete Rebuild

If nothing works, do a complete rebuild:

```bash
cd /var/www/huize-bruce

# Clean everything
rm -rf node_modules dist

# Reinstall and rebuild
npm install
npm run build

# Verify
ls -la dist/
cat dist/index.html | head -30

# Reload Nginx
sudo systemctl reload nginx
```

