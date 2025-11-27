// Simple API server for calendar subscriptions
// Run this alongside your static site: node api-server.js
// Or use PM2: pm2 start api-server.js --name calendar-api

const http = require('http');
const url = require('url');
const { ANCHOR_DATE, PEOPLE_ORDER, TASKS } = require('./constants.tsx');

const PORT = 3001; // Different port from the static site

// Import the getWeekData function logic
// For simplicity, we'll replicate the logic here
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
  
  // Generate assignments (same logic as utils.ts)
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
  
  // Generate events for the next 52 weeks (1 year)
  for (let i = 0; i < 52; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (i * 7));
    
    const weekData = getWeekData(targetDate);
    const assignment = weekData.assignments.find(a => a.assignedTo === person);
    
    if (assignment) {
      const eventStart = new Date(weekData.startDate);
      eventStart.setDate(eventStart.getDate() + 1); // Monday
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
    'X-WR-CALNAME:Huize Bruce Weektaak - ' + person,
    'X-WR-TIMEZONE:Europe/Amsterdam',
    eventsContent,
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Handle calendar subscription requests
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
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(ics);
        return;
      }
    }
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`📅 Calendar API server running on port ${PORT}`);
  console.log(`   Calendar URLs: http://localhost:${PORT}/api/calendar/{person}.ics`);
});

