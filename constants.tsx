import React from 'react';
import { Person, TaskDefinition } from './types';
import { Trash2, Armchair, ShoppingBag, Droplets, Monitor, Sofa, Sparkles, Utensils } from 'lucide-react';

// Based on the whiteboard: "Week 1: 10-16 Nov"
// We assume year 2024 to make it current/future proof relative to the prompt.
export const ANCHOR_DATE = new Date('2024-11-10T00:00:00'); 

export const PEOPLE_ORDER: Person[] = [
  Person.Vera,    // Index 0
  Person.Uli,     // Index 1
  Person.Phee,    // Index 2
  Person.Vincent, // Index 3
  Person.Feie     // Index 4
];

export const TASKS: TaskDefinition[] = [
  {
    id: 'afval',
    title: 'Afval',
    description: 'Empty bins & put out trash',
    icon: <Trash2 className="w-6 h-6" />,
    color: 'blue'
  },
  {
    id: 'vloer',
    title: 'Vloer, Bank & Tafel',
    description: 'Vacuum floor, clean couch & table',
    icon: <Sofa className="w-6 h-6" />,
    color: 'indigo'
  },
  {
    id: 'doekjes',
    title: 'Doekjes & Boodschappen',
    description: 'Cleaning cloths & groceries',
    icon: <ShoppingBag className="w-6 h-6" />,
    color: 'emerald'
  },
  {
    id: 'aanrecht',
    title: 'Aanrecht',
    description: 'Clean kitchen counter & sink',
    icon: <Utensils className="w-6 h-6" />,
    color: 'cyan'
  },
  {
    id: 'bureau',
    title: 'Bureautje & Kastje',
    description: 'Dust desk & cabinet',
    icon: <Monitor className="w-6 h-6" />,
    color: 'violet'
  }
];

// Helper to get Tailwind classes based on color name
export const getColorClasses = (color: string) => {
  switch (color) {
    case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'indigo': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'emerald': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'cyan': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'violet': return 'bg-violet-100 text-violet-700 border-violet-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const getAvatarColor = (name: Person) => {
  switch (name) {
    case Person.Vera: return 'bg-pink-500';
    case Person.Uli: return 'bg-yellow-500';
    case Person.Phee: return 'bg-green-500';
    case Person.Vincent: return 'bg-blue-500';
    case Person.Feie: return 'bg-purple-500';
  }
};