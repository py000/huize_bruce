import React from 'react';

export enum Person {
  Vera = 'Vera',
  Uli = 'Uli',
  Phee = 'Phee',
  Vincent = 'Vincent',
  Feie = 'Feie'
}

export interface TaskDefinition {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string; // Tailwind class string for bg/text accents
}

export interface WeeklyAssignment {
  task: TaskDefinition;
  assignedTo: Person;
}

export interface WeekData {
  weekNumber: number; // The absolute week number relative to start
  cycleWeek: number; // 1-5
  startDate: Date;
  endDate: Date;
  assignments: WeeklyAssignment[];
}