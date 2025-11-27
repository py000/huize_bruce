import { ANCHOR_DATE, PEOPLE_ORDER, TASKS } from './constants';
import { Person, WeekData, WeeklyAssignment } from './types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calculates the week data based on a target date relative to the anchor date.
 * Anchor Date (Week 1) is Nov 10, 2024.
 */
export const getWeekData = (targetDate: Date): WeekData => {
  // Normalize dates to midnight to avoid time zone drift issues in simple math
  const startOfAnchor = new Date(ANCHOR_DATE);
  startOfAnchor.setHours(0, 0, 0, 0);

  const startOfTarget = new Date(targetDate);
  startOfTarget.setHours(0, 0, 0, 0);

  // Find the closest Monday (or Sunday depending on region, but whiteboard starts Nov 10 which is Sunday)
  // We align everything to the cycle start date.
  
  const diffTime = startOfTarget.getTime() - startOfAnchor.getTime();
  const diffDays = Math.floor(diffTime / MS_PER_DAY);
  
  // Calculate weeks passed. 
  // If diffDays is negative (before start), we handle it gracefully with floor
  const weeksPassed = Math.floor(diffDays / 7);

  // The cycle is 5 weeks long
  // We need a positive modulo index even if weeksPassed is negative
  const cycleIndex = ((weeksPassed % 5) + 5) % 5;
  
  // Current Week Start Date
  const currentWeekStart = new Date(startOfAnchor);
  currentWeekStart.setDate(startOfAnchor.getDate() + (weeksPassed * 7));
  
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

  // Exact assignments from CSV file (huize-bruce-weeks-from-2025-11-10-to-2027.csv)
  // CSV column order: Afval, Vloer+Bank, Aanrecht, Bureautje, Boodschappen
  // Our task order: Afval(0), Vloer(1), Doekjes(2), Aanrecht(3), Bureau(4)
  // Mapping: CSV[0]=Our[0], CSV[1]=Our[1], CSV[2]=Our[3], CSV[3]=Our[4], CSV[4]=Our[2]
  // Week 1: Afval->Vera(0), Vloer->Uli(1), Aanrecht->Vincent(3), Bureau->Feie(4), Doekjes->Phee(2)
  // Week 2: Afval->Uli(1), Vloer->Phee(2), Aanrecht->Feie(4), Bureau->Vera(0), Doekjes->Vincent(3)
  // Week 3: Afval->Phee(2), Vloer->Vincent(3), Aanrecht->Vera(0), Bureau->Uli(1), Doekjes->Feie(4)
  // Week 4: Afval->Vincent(3), Vloer->Feie(4), Aanrecht->Uli(1), Bureau->Phee(2), Doekjes->Vera(0)
  // Week 5: Afval->Feie(4), Vloer->Vera(0), Aanrecht->Phee(2), Bureau->Vincent(3), Doekjes->Uli(1)
  
  const assignments: WeeklyAssignment[] = TASKS.map((task, taskIndex) => {
    // Task order in our code: 0=Afval, 1=Vloer, 2=Doekjes, 3=Aanrecht, 4=Bureau
    // CSV order: 0=Afval, 1=Vloer+Bank, 2=Aanrecht, 3=Bureautje, 4=Boodschappen
    // So: Our[0]=CSV[0], Our[1]=CSV[1], Our[2]=CSV[4], Our[3]=CSV[2], Our[4]=CSV[3]
    
    let personIndex: number;
    
    if (taskIndex === 0) {
      // Afval: standard rotation starting at 0
      personIndex = cycleIndex % 5;
    } else if (taskIndex === 1) {
      // Vloer: standard rotation starting at 1
      personIndex = (1 + cycleIndex) % 5;
    } else if (taskIndex === 2) {
      // Doekjes (Boodschappen in CSV): standard rotation starting at 2
      personIndex = (2 + cycleIndex) % 5;
    } else if (taskIndex === 3) {
      // Aanrecht: [3, 4, 0, 1, 2] from CSV
      const pattern = [3, 4, 0, 1, 2];
      personIndex = pattern[cycleIndex];
    } else {
      // Bureau (Bureautje in CSV): [4, 0, 1, 2, 3] from CSV
      const pattern = [4, 0, 1, 2, 3];
      personIndex = pattern[cycleIndex];
    }
    
    return {
      task,
      assignedTo: PEOPLE_ORDER[personIndex]
    };
  });

  return {
    weekNumber: weeksPassed + 1, // Human readable (Week 1, Week 2...)
    cycleWeek: cycleIndex + 1,   // 1-5
    startDate: currentWeekStart,
    endDate: currentWeekEnd,
    assignments
  };
};

export const formatDateRange = (start: Date, end: Date): string => {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('nl-NL', options)} - ${end.toLocaleDateString('nl-NL', options)}`;
};

export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getDate() === d2.getDate() && 
         d1.getMonth() === d2.getMonth() && 
         d1.getFullYear() === d2.getFullYear();
};

/**
 * Checks if a date falls within a week range (inclusive)
 */
export const isDateInWeek = (date: Date, weekStart: Date, weekEnd: Date): boolean => {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(weekEnd);
  end.setHours(23, 59, 59, 999);
  
  return checkDate >= start && checkDate <= end;
};