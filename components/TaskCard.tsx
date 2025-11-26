import React from 'react';
import { WeeklyAssignment } from '../types';
import { getColorClasses, getAvatarColor } from '../constants';

interface TaskCardProps {
  assignment: WeeklyAssignment;
}

export const TaskCard: React.FC<TaskCardProps> = ({ assignment }) => {
  const { task, assignedTo } = assignment;
  const colorClasses = getColorClasses(task.color);
  const avatarColor = getAvatarColor(assignedTo);

  return (
    <div 
      className="relative overflow-hidden rounded-2xl border bg-white border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md"
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
          <span className="text-xs font-semibold text-slate-400">
            {assignedTo}
          </span>
        </div>
      </div>
    </div>
  );
};