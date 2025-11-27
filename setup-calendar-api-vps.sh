#!/bin/bash

# Setup Calendar API on VPS
# Run this on your VPS

set -e

cd /var/www/huize-bruce

echo "📅 Setting up Calendar API Server"
echo "=================================="
echo ""

# Check if files exist
if [ ! -f "calendar-api-server.js" ]; then
    echo "❌ calendar-api-server.js not found!"
    echo "   Pulling latest from GitHub..."
    git pull origin main || echo "   Could not pull from GitHub"
    
    if [ ! -f "calendar-api-server.js" ]; then
        echo "   Creating calendar-api-server.js..."
        cat > calendar-api-server.js << 'EOF'
const http = require('http');
const url = require('url');

const PORT = 3001;
const ANCHOR_DATE = new Date('2025-11-10T00:00:00');
const PEOPLE_ORDER = ['Vera', 'Uli', 'Phee', 'Vincent', 'Feie'];
const TASKS = [
  { id: 'afval', title: 'Afval', description: 'Empty bins & put out trash' },
  { id: 'vloer', title: 'Vloer, Bank & Tafel', description: 'Vacuum floor, clean couch & table' },
  { id: 'doekjes', title: 'Doekjes & Boodschappen', description: 'Cleaning cloths & groceries' },
  { id: 'aanrecht', title: 'Aanrecht', description: 'Clean kitchen counter & sink' },
  { id: 'bureau', title: 'Bureautje & Kastje', description: 'Dust desk & cabinet' }
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getWeekData(targetDate) {
  const startOfAnchor = new Date(ANCHOR_DATE);
  startOfAnchor.setHours(0, 0, 0, 0);
  const startOfTarget = new Date(targetDate);
  startOfTarget.setHours(0, 0, 0, 0);
  
  const diffTime = startOfTarget.getTime() - startOfAnchor.getTime();
  const diffDays = Math.floor(diffTime / MS_PER_DAY);
  const weeksPassed = Math.floor(diffDays / 7);
  const cycleIndex = ((weeksPassed % 5) + 5) % 5;
  
  const currentWeekStart = new Date(startOfAnchor);
  currentWeekStart.setDate(startOfAnchor.getDate() + (weeksPassed * 7));
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  
  const assignments = TASKS.map((task, taskIndex) => {
    let personIndex;
    if (taskIndex === 0) {
      personIndex = cycleIndex % 5;
    } else if (taskIndex === 1) {
      personIndex = (1 + cycleIndex) % 5;
    } else if (taskIndex === 2) {
      personIndex = (2 + cycleIndex) % 5;
    } else if (taskIndex === 3) {
      const pattern = [3, 4, 0, 1, 2];
      personIndex = pattern[cycleIndex];
    } else {
      const pattern = [4, 0, 1, 2, 3];
      personIndex = pattern[cycleIndex];
    }
    return {
      task: TASKS[taskIndex],
      assignedTo: PEOPLE_ORDER[personIndex]
    };
  });
  
  return {
    weekNumber: weeksPassed + 1,
    cycleWeek: cycleIndex + 1,
    startDate: currentWeekStart,
    endDate: currentWeekEnd,
    assignments
  };
}

function formatDateTime(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function generateICS(person) {
  const nowStamp = formatDateTime(new Date());
  let eventsContent = '';
  
  for (let i = 0; i < 104; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (i * 7));
    
    const weekData = getWeekData(targetDate);
    const assignment = weekData.assignments.find(a => a.assignedTo === person);
    
    if (assignment) {
      const eventStart = new Date(weekData.startDate);
      eventStart.setDate(eventStart.getDate() + 1);
      eventStart.setHours(0, 0, 0, 0);
      
      const eventEnd = new Date(eventStart);
      eventEnd.setHours(2, 0, 0, 0);
      
      const uid = `huizebruce-${person.toLowerCase()}-${formatDateTime(eventStart)}@huizebruce.app`;
      
      eventsContent += [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${formatDateTime(eventStart)}`,
        `DTEND:${formatDateTime(eventEnd)}`,
        `SUMMARY:Huize Bruce: ${assignment.task.title}`,
        `DESCRIPTION:${assignment.task.description}\\n(Weektaak for ${person})`,
        'LOCATION:Huize Bruce',
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'RRULE:FREQ=WEEKLY;COUNT=1',
        'END:VEVENT',
        ''
      ].join('\r\n');
    }
  }
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Huize Bruce//Weektaak Rotation//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Huize Bruce Weektaak - ${person}`,
    'X-WR-TIMEZONE:Europe/Amsterdam',
    eventsContent,
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  if (path.startsWith('/api/calendar/')) {
    const personMatch = path.match(/\/api\/calendar\/(\w+)\.ics$/);
    if (personMatch) {
      const personName = personMatch[1].charAt(0).toUpperCase() + personMatch[1].slice(1);
      const person = PEOPLE_ORDER.find(p => p.toLowerCase() === personName.toLowerCase());
      
      if (person) {
        const ics = generateICS(person);
        res.writeHead(200, {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="huize_bruce_${personName.toLowerCase()}.ics"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.end(ics);
        return;
      }
    }
  }
  
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`📅 Calendar API server running on port ${PORT}`);
  console.log(`   Available at: http://localhost:${PORT}/api/calendar/{person}.ics`);
});
EOF
        echo "✅ Created calendar-api-server.js"
    fi
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Start the API server
echo ""
echo "🚀 Starting API server..."
pm2 start calendar-api-server.js --name calendar-api || pm2 restart calendar-api

# Save PM2 configuration
pm2 save

echo ""
echo "✅ Calendar API server is running!"
echo ""
echo "🧪 Test it:"
echo "   curl http://localhost:3001/api/calendar/vera.ics"
echo ""
echo "📋 PM2 commands:"
echo "   pm2 list              - View processes"
echo "   pm2 logs calendar-api - View logs"
echo "   pm2 restart calendar-api - Restart"

