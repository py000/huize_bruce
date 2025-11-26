import React from 'react';
import { Person, WeeklyAssignment } from '../types';
import { getColorClasses, getAvatarColor } from '../constants';

interface TaskCardProps {
  assignment: WeeklyAssignment;
  isHighlighted: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ assignment, isHighlighted }) => {
  const { task, assignedTo } = assignment;
  const colorClasses = getColorClasses(task.color);
  const avatarColor = getAvatarColor(assignedTo);

  return (
    <div 
      className={`
        relative overflow-hidden rounded-2xl border transition-all duration-300
        ${isHighlighted 
          ? 'bg-white border-indigo-500 ring-2 ring-indigo-200 shadow-xl scale-[1.02] z-10' 
          : 'bg-white border-slate-200 shadow-sm opacity-90'
        }
      `}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Icon Box */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses} bg-opacity-50`}>
          {task.icon}
        </div>

        {/* Text Content */}
        <div className="flex-grow min-w-0">
          <h3 className="font-bold text-slate-800 text-lg truncate">
            {task.title}
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm truncate">
            {task.description}
          </p>
        </div>

        {/* Assigned Person */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[60px]">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${avatarColor}`}>
            {assignedTo.substring(0, 2).toUpperCase()}
          </div>
          <span className={`text-xs font-semibold ${isHighlighted ? 'text-indigo-600' : 'text-slate-400'}`}>
            {assignedTo}
          </span>
        </div>
      </div>
      
      {/* Visual Indicator for highlighted user */}
      {isHighlighted && (
        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
          <div className="absolute top-[8px] right-[-24px] bg-indigo-500 text-white text-[10px] py-1 px-8 rotate-45 font-bold shadow-sm">
            YOURS
          </div>
        </div>
      )}
    </div>
  );
};