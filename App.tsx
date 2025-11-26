import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Calendar, User, Info, RotateCcw } from 'lucide-react';
import { PEOPLE_ORDER } from './constants';
import { Person } from './types';
import { getWeekData, formatDateRange } from './utils';
import { TaskCard } from './components/TaskCard';

export default function App() {
  // We initialize with a date in "Week 3" (Nov 26, 2024) to match the prompt's context initially
  // In a real production build, this would default to new Date().
  // However, to satisfy "this week is week 3", we start the simulation there.
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const demoDate = new Date('2024-11-26T12:00:00'); // Week 3
    return demoDate;
  });

  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Switch to real date
  const handleGoLive = () => {
    setCurrentDate(new Date());
    setIsLiveMode(true);
  };

  const handleResetDemo = () => {
    setCurrentDate(new Date('2024-11-26T12:00:00')); // Reset to Week 3
    setIsLiveMode(false);
  }

  const weekData = useMemo(() => getWeekData(currentDate), [currentDate]);

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
    setIsLiveMode(false); // If they navigate manually, they are no longer in "Live" mode necessarily
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
    setIsLiveMode(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-slate-200">
      
      {/* Header Section */}
      <header className="bg-white px-6 pt-8 pb-4 sticky top-0 z-20 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h1 className="font-font-display text-3xl font-extrabold text-slate-800 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Huize Bruce
          </h1>
          <button 
            onClick={isLiveMode ? handleResetDemo : handleGoLive}
            className={`text-xs font-semibold px-2 py-1 rounded-full border ${isLiveMode ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
          >
            {isLiveMode ? 'LIVE DATE' : 'DEMO MODE'}
          </button>
        </div>
        
        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
          <button 
            onClick={handlePrevWeek}
            className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-indigo-600 transition-all active:scale-95"
            aria-label="Previous Week"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">
              Current Period
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold text-slate-800 text-lg">Week {weekData.cycleWeek}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 text-sm font-medium whitespace-nowrap">
                {formatDateRange(weekData.startDate, weekData.endDate)}
              </span>
            </div>
          </div>

          <button 
            onClick={handleNextWeek}
            className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-indigo-600 transition-all active:scale-95"
            aria-label="Next Week"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Filter Section (Sticky under header) */}
      <div className="bg-white/95 backdrop-blur-sm px-6 py-3 sticky top-[138px] z-10 border-b border-slate-100">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2 scroll-smooth">
          <div className={`
            flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors border
            ${selectedPerson === null 
              ? 'bg-slate-800 text-white border-slate-800' 
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}
          `}
          onClick={() => setSelectedPerson(null)}
          >
            All
          </div>
          {PEOPLE_ORDER.map(person => (
            <div
              key={person}
              onClick={() => setSelectedPerson(person === selectedPerson ? null : person)}
              className={`
                flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors border
                ${selectedPerson === person 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'}
              `}
            >
              {person}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4 pb-12">
          {weekData.assignments.map((assignment) => {
            const isAssignedToSelected = selectedPerson === assignment.assignedTo;
            const isFaded = selectedPerson !== null && !isAssignedToSelected;

            return (
              <div 
                key={assignment.task.id} 
                className={`transition-opacity duration-300 ${isFaded ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
              >
                <TaskCard 
                  assignment={assignment} 
                  isHighlighted={isAssignedToSelected}
                />
              </div>
            );
          })}
        </div>

        {/* Empty state if nothing matches (should theoretically not happen with this logic, but good practice) */}
        {weekData.assignments.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No tasks found for this week.</p>
          </div>
        )}
      </main>

      {/* Footer / Context */}
      <footer className="bg-slate-100 p-4 text-center text-xs text-slate-400 border-t border-slate-200">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Calendar className="w-3 h-3" />
          <span>Rotation starts Nov 10</span>
        </div>
        <p>Tasks rotate automatically every Sunday.</p>
      </footer>
    </div>
  );
}