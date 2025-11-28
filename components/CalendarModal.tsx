import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, ChevronRight, Copy, Check } from 'lucide-react';
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
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedPerson(PEOPLE_ORDER[0]);
      setCopiedUrl(null);
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
      // event.date already represents the Monday of that week
      const eventStart = new Date(event.date);
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

  // Generate subscription URLs
  const getBaseUrl = () => {
    // Use current window location, or default to the VPS URL if available
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // If localhost, use the VPS URL (you can change this to your actual domain)
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return 'http://57.131.25.225'; // Main site URL (Nginx will proxy /api/ to port 3001)
      }
      // For production, use the same origin (Nginx proxies /api/ to the API server)
      return origin;
    }
    return 'http://57.131.25.225'; // Fallback to VPS URL
  };

  const getSubscriptionUrl = () => {
    const baseUrl = getBaseUrl();
    const personLower = selectedPerson.toLowerCase();
    // This URL points to the API endpoint that serves the ICS file
    // Nginx will proxy /api/calendar/*.ics to the Node.js server on port 3001
    return `${baseUrl}/api/calendar/${personLower}.ics`;
  };

  const getAppleCalendarUrl = () => {
    const url = getSubscriptionUrl();
    // Apple Calendar uses webcal:// protocol for subscriptions
    return url.replace(/^https?:\/\//, 'webcal://');
  };

  const getGoogleCalendarUrl = () => {
    const url = getSubscriptionUrl();
    // Google Calendar subscription URL - encode the ICS URL
    return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(url)}`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      // Try modern clipboard API first (works on HTTPS and localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedUrl(type);
        setTimeout(() => setCopiedUrl(null), 2000);
        return;
      }
      
      // Fallback for older browsers or non-HTTPS contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopiedUrl(type);
          setTimeout(() => setCopiedUrl(null), 2000);
        } else {
          throw new Error('Copy command failed');
        }
      } catch (err) {
        console.error('Fallback copy failed:', err);
        // Last resort: find and select the input field
        const inputs = document.querySelectorAll('input[readonly]');
        inputs.forEach((input) => {
          const htmlInput = input as HTMLInputElement;
          if (htmlInput.value === text) {
            htmlInput.select();
            htmlInput.setSelectionRange(0, text.length);
          }
        });
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      // Last resort: find and select the input field
      const inputs = document.querySelectorAll('input[readonly]');
      inputs.forEach((input) => {
        const htmlInput = input as HTMLInputElement;
        if (htmlInput.value === text) {
          htmlInput.select();
          htmlInput.setSelectionRange(0, text.length);
        }
      });
    }
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
                      {event.date.getDate()}
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

          {/* Subscription URLs Section */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Calendar Subscription
            </label>
            
            {/* Apple Calendar */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-600">Apple Calendar</span>
                {copiedUrl === 'apple' && (
                  <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Copied!
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getAppleCalendarUrl()}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).select();
                    (e.target as HTMLInputElement).setSelectionRange(0, getAppleCalendarUrl().length);
                  }}
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono cursor-pointer"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(getAppleCalendarUrl(), 'apple');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                  title="Copy Apple Calendar URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Copy this URL and subscribe in Apple Calendar
              </p>
            </div>

            {/* Google Calendar */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-600">Google Calendar</span>
                {copiedUrl === 'google' && (
                  <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Copied!
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getGoogleCalendarUrl()}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).select();
                    (e.target as HTMLInputElement).setSelectionRange(0, getGoogleCalendarUrl().length);
                  }}
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono cursor-pointer"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(getGoogleCalendarUrl(), 'google');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                  title="Copy Google Calendar URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Copy this URL and add to Google Calendar
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400 font-semibold">OR</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Download Button */}
          <a 
            href={getIcsHref()} 
            download={`huize_bruce_${selectedPerson.toLowerCase()}_schedule.ics`}
            className="flex items-center justify-center w-full gap-2 bg-indigo-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 group"
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Download .ics File</span>
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
          </a>

          <p className="text-[10px] text-slate-400 text-center mt-4 px-2 leading-relaxed">
            Subscribe to get automatic updates, or download a one-time calendar file.
          </p>

        </div>
      </div>
    </div>
  );
};