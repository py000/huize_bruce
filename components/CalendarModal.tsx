import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { Person } from '../types';
import { PEOPLE_ORDER, getAvatarColor } from '../constants';
import { getWeekData } from '../utils';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: Date;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ 
  isOpen, 
  onClose,
  startDate
}) => {
  const [selectedPerson, setSelectedPerson] = useState<Person>(PEOPLE_ORDER[0]);
  const [upcomingEvents, setUpcomingEvents] = useState<{date: Date, taskName: string, description: string}[]>([]);
  
  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedPerson(PEOPLE_ORDER[0]);
    }
  }, [isOpen]);

  // Calculate upcoming 4 weeks whenever person changes or the start date changes
  useEffect(() => {
    const events = [];
    
    // We want the next 4 weeks starting from the CURRENTLY VIEWED week (startDate)
    for (let i = 0; i < 4; i++) {
      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + (i * 7));
      
      const data = getWeekData(targetDate);
      const assignment = data.assignments.find(a => a.assignedTo === selectedPerson);
      
      if (assignment) {
        events.push({
          date: data.startDate, // Start of that week
          taskName: assignment.task.title,
          description: assignment.task.description
        });
      }
    }
    setUpcomingEvents(events);
  }, [selectedPerson, startDate]);

  if (!isOpen) return null;

  // Format helper for ICS dates: YYYYMMDDTHHMMSS
  const formatDateTime = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const generateIcsData = () => {
    const nowStamp = formatDateTime(new Date());
    let eventsContent = '';

    upcomingEvents.forEach((event, index) => {
      // Adjust to Monday 00:00 - 02:00
      // event.date is likely Sunday (from utils). Add 1 day for Monday.
      const eventStart = new Date(event.date);
      eventStart.setDate(eventStart.getDate() + 1); 
      eventStart.setHours(0, 0, 0, 0);

      const eventEnd = new Date(eventStart);
      eventEnd.setHours(2, 0, 0, 0);

      // Create a unique UID for each specific week's task
      const uid = `huizebruce-${selectedPerson.toLowerCase()}-${formatDateTime(eventStart)}@huizebruce.app`;

      eventsContent += [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${formatDateTime(eventStart)}`,
        `DTEND:${formatDateTime(eventEnd)}`,
        `SUMMARY:Huize Bruce: ${event.taskName}`,
        `DESCRIPTION:${event.description}\\n(Weektaak for ${selectedPerson})`,
        'LOCATION:Huize Bruce',
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        ''
      ].join('\r\n');
    });

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Huize Bruce//Weektaak Rotation//NL',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Huize Bruce Weektaak',
      'X-WR-TIMEZONE:Europe/Amsterdam',
      eventsContent,
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  };

  const getIcsHref = () => {
    const ics = generateIcsData();
    const base64 = btoa(unescape(encodeURIComponent(ics)));
    // Use standard data URI for direct import
    return `data:text/calendar;base64,${base64}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            Add to Calendar
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          
          {/* Person Selector */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0">
              Who are you?
            </label>
            {/* Padding py-4 prevents shadow/scale clipping */}
            <div className="flex gap-3 overflow-x-auto py-4 px-2 -mx-2 no-scrollbar snap-x">
              {PEOPLE_ORDER.map(person => {
                const isSelected = selectedPerson === person;
                return (
                  <button
                    key={person}
                    onClick={() => setSelectedPerson(person)}
                    className={`
                      flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all duration-300 snap-center
                      ${isSelected 
                        ? 'bg-indigo-50 ring-2 ring-indigo-500 scale-110 z-10 shadow-lg shadow-indigo-100' 
                        : 'hover:bg-slate-50 opacity-60 hover:opacity-100 scale-95'}
                    `}
                  >
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md transition-transform
                      ${getAvatarColor(person)}
                    `}>
                      {person.substring(0, 2).toUpperCase()}
                    </div>
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                      {person}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upcoming Preview */}
          <div className="mb-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex justify-between items-end mb-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Schedule Snapshot
              </label>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Next 4 Weeks
              </span>
            </div>
            
            <div className="space-y-0 divide-y divide-slate-200 border-t border-b border-slate-200 bg-white rounded-lg overflow-hidden">
              {upcomingEvents.map((event, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center justify-center min-w-[40px] px-1 py-1 rounded border border-slate-100 bg-slate-50">
                     <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">
                       {event.date.toLocaleDateString('en-US', {month: 'short'})}
                     </span>
                     <span className="text-sm font-bold text-slate-700 leading-none mt-0.5">
                       {event.date.getDate() + 1}
                     </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-700 text-sm truncate">
                      {event.taskName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Monday 00:00 - 02:00
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <a 
            href={getIcsHref()} 
            download={`huize_bruce_${selectedPerson.toLowerCase()}_schedule.ics`}
            className="flex items-center justify-center w-full gap-2 bg-indigo-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 group"
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Add to Calendar</span>
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
          </a>

          <p className="text-[10px] text-slate-400 text-center mt-4 px-2 leading-relaxed">
            Downloads a calendar file (.ics) with your tasks for the next 4 weeks. Open the file to add the events to your calendar.
          </p>

        </div>
      </div>
    </div>
  );
};