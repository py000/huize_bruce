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

  const assignments: WeeklyAssignment[] = TASKS.map((task, taskIndex) => {
    // Logic from whiteboard:
    // Week 1 (Index 0): Task 0 -> Person 0, Task 1 -> Person 1...
    // Week 2 (Index 1): Task 0 -> Person 1, Task 1 -> Person 2...
    // Formula: PersonIndex = (TaskIndex + WeekIndex) % 5
    const personIndex = (taskIndex + cycleIndex) % 5;
    
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