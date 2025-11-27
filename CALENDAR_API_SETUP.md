# Calendar Subscription API Setup

This guide explains how to set up the calendar subscription API server for Apple Calendar and Google Calendar integration.

## Overview

The calendar subscription feature allows users to subscribe to their weekly task schedule. The API server generates ICS files dynamically based on the person selected.

## Setup on VPS

### Step 1: Install Node.js (if not already installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Copy the API Server

The `calendar-api-server.js` file should be in your repository. Make sure it's on your VPS:

```bash
cd /var/www/huize-bruce
ls -la calendar-api-server.js
```

### Step 3: Run the API Server

#### Option A: Direct Run (for testing)

```bash
cd /var/www/huize-bruce
node calendar-api-server.js
```

The server will run on port 3001.

#### Option B: Using PM2 (Recommended for Production)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the API server
cd /var/www/huize-bruce
pm2 start calendar-api-server.js --name calendar-api

# Make it start on boot
pm2 startup
pm2 save
```

### Step 4: Configure Nginx to Proxy API Requests

Update your Nginx configuration to proxy API requests to the Node.js server:

```bash
sudo nano /etc/nginx/sites-available/huize-bruce
```

Add this location block inside your server block:

```nginx
server {
    listen 80;
    server_name 57.131.25.225;
    root /var/www/huize-bruce/dist;
    index index.html;
    
    # ... existing config ...
    
    # Proxy API requests to Node.js server
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # ... rest of config ...
}
```

Then reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Update CalendarModal Base URL

If your API is on a different domain or port, update the `getBaseUrl()` function in `components/CalendarModal.tsx`:

```typescript
const getBaseUrl = () => {
  // Replace with your actual API URL
  return 'https://yourdomain.com'; // or 'http://57.131.25.225' if same server
};
```

## Testing

### Test the API endpoint:

```bash
# Test locally
curl http://localhost:3001/api/calendar/vera.ics

# Test from VPS
curl http://57.131.25.225/api/calendar/vera.ics
```

You should receive an ICS file with calendar events.

### Test in Browser:

1. Open your app
2. Click "Sync" button
3. Select a person
4. Copy the Apple Calendar or Google Calendar subscription URL
5. Test the subscription URL in your calendar app

## Apple Calendar Subscription

1. Copy the `webcal://` URL from the app
2. Open Apple Calendar
3. Go to File → New Calendar Subscription
4. Paste the URL
5. Configure update frequency (recommended: Every day)
6. Click Subscribe

## Google Calendar Subscription

1. Copy the Google Calendar URL from the app
2. Open Google Calendar on the web
3. Click the "+" next to "Other calendars"
4. Select "From URL"
5. Paste the URL
6. Click "Add calendar"

Or use the direct link - clicking the Google Calendar URL will open Google Calendar with the subscription ready to add.

## Troubleshooting

### API server not responding
- Check if the server is running: `pm2 list` or `ps aux | grep calendar-api`
- Check logs: `pm2 logs calendar-api`
- Verify port 3001 is open: `sudo netstat -tlnp | grep 3001`

### Nginx proxy not working
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify proxy_pass URL is correct
- Test the API directly: `curl http://localhost:3001/api/calendar/vera.ics`

### Calendar not updating
- Subscription URLs need to be accessible from the internet
- Make sure the API server is running and accessible
- Check that the ICS file is being generated correctly

## Security Notes

- The API server is currently open to all requests
- Consider adding rate limiting for production
- You may want to add authentication if needed
- Ensure your firewall allows traffic on port 3001 (or configure Nginx proxy)

