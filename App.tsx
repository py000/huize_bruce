import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Info, CalendarPlus } from 'lucide-react';
import { getWeekData, formatDateRange, isDateInWeek } from './utils';
import { TaskCard } from './components/TaskCard';
import { CalendarModal } from './components/CalendarModal';

export default function App() {
  // Initialize with today's date to show the current week
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    return new Date();
  });

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Switch to real date
  const handleGoLive = () => {
    setCurrentDate(new Date());
    setIsLiveMode(true);
  };

  const handleResetDemo = () => {
    setCurrentDate(new Date()); // Reset to current week
    setIsLiveMode(false);
  }

  const weekData = useMemo(() => getWeekData(currentDate), [currentDate]);
  
  // Check if the displayed week is the current week (contains today's date)
  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    return isDateInWeek(today, weekData.startDate, weekData.endDate);
  }, [weekData.startDate, weekData.endDate]);

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
      <header className="bg-white px-6 pt-8 pb-6 sticky top-0 z-20 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-font-display text-3xl font-extrabold text-slate-800 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Huize Bruce
          </h1>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsCalendarModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors"
              aria-label="Sync to Calendar"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Sync</span>
            </button>
            <button 
              onClick={isLiveMode ? handleResetDemo : handleGoLive}
              className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center ${isLiveMode ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
            >
              {isLiveMode ? 'LIVE' : 'DEMO'}
            </button>
          </div>
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
            <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isCurrentWeek ? 'text-green-600' : 'text-slate-400'}`}>
              {isCurrentWeek ? 'Current Period' : 'Viewing Week'}
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

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4 pb-12">
          {weekData.assignments.map((assignment) => (
            <div 
              key={assignment.task.id} 
              className="transition-opacity duration-300"
            >
              <TaskCard assignment={assignment} />
            </div>
          ))}
        </div>

        {/* Empty state if nothing matches */}
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

      <CalendarModal 
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        startDate={currentDate}
      />
    </div>
  );
}