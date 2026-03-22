"use client"

import React from 'react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { Task } from '@/types/task';
import { isTaskOnDate } from '@/lib/recurrence/taskRecurrence';

interface MonthGridProps {
  currentDate: string; // ISO string of the reference month
  tasks: Task[];
  onDateClick?: (date: string) => void;
  onTaskClick?: (task: Task) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function taskColor(task: Task): string {
  if (task.priority?.includes('urgent'))  return 'bg-red-100 text-red-800 border-l-2 border-red-400';
  if (task.priority?.includes('personal')) return 'bg-purple-100 text-purple-800 border-l-2 border-purple-400';
  if (task.priority?.includes('work'))     return 'bg-emerald-100 text-emerald-800 border-l-2 border-emerald-400';
  return 'bg-blue-100 text-blue-800 border-l-2 border-blue-400';
}

export function MonthGrid({ currentDate, tasks, onDateClick, onTaskClick }: MonthGridProps) {
  const router   = useRouter();
  const baseDate = dayjs(currentDate);

  // Build day cells: start from first Sunday on or before the 1st of the month
  const startDate = baseDate.startOf('month').startOf('week');
  const endDate   = baseDate.endOf('month').endOf('week');

  const days = React.useMemo(() => {
    const computedDays: {
      dateStr: string;
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
      tasks: Task[];
    }[] = [];

    let cur = startDate;
    while (cur.isBefore(endDate) || cur.isSame(endDate, 'day')) {
      const dateStr = cur.format('YYYY-MM-DD');
      const dow = cur.day(); // 0=Sun, 6=Sat
      computedDays.push({
        dateStr,
        day: cur.date(),
        isCurrentMonth: cur.month() === baseDate.month(),
        isToday: cur.isSame(dayjs(), 'day'),
        isWeekend: dow === 0 || dow === 6,
        tasks: tasks.filter(t => isTaskOnDate(t, dateStr)),
      });
      cur = cur.add(1, 'day');
    }
    return computedDays;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, tasks]);

  const handleCellClick = (dateStr: string) => {
    if (onDateClick) {
      onDateClick(dateStr);
    } else {
      router.push('/day');
    }
  };

  const MAX_VISIBLE = 3;

  return (
    <div className="flex flex-col h-full w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

      {/* ── Day-of-week header ─────────────────────────────────────────── */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-2.5 text-center text-xs font-semibold uppercase tracking-wide
              ${i === 0 || i === 6 ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ──────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-7 auto-rows-[1fr]">
        {days.map((d, i) => {
          const isLastCol = i % 7 === 6;
          const visibleTasks  = d.tasks.slice(0, MAX_VISIBLE);
          const overflowCount = d.tasks.length - MAX_VISIBLE;

          return (
            <div
              key={d.dateStr}
              onClick={() => handleCellClick(d.dateStr)}
              className={[
                'relative flex flex-col min-h-0 p-1.5 cursor-pointer transition-colors group',
                'border-b border-gray-100',
                isLastCol ? '' : 'border-r border-gray-100',
                d.isWeekend && d.isCurrentMonth ? 'bg-gray-50/60' : '',
                !d.isCurrentMonth ? 'bg-gray-50/30' : 'hover:bg-blue-50/30',
              ].join(' ')}
            >
              {/* Date number */}
              <div className="flex items-center justify-end mb-1">
                <span
                  className={[
                    'flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium transition-colors',
                    d.isToday
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : d.isCurrentMonth
                        ? 'text-gray-800 group-hover:bg-blue-100 group-hover:text-blue-700'
                        : 'text-gray-300',
                  ].join(' ')}
                >
                  {d.day}
                </span>
              </div>

              {/* Task pills */}
              <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                {visibleTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={e => { e.stopPropagation(); onTaskClick?.(task); }}
                    title={task.title}
                    className={`truncate rounded px-1.5 py-px text-[11px] font-medium cursor-pointer
                      hover:brightness-95 transition-all leading-4 ${taskColor(task)}`}
                  >
                    {task.startTime && (
                      <span className="opacity-60 mr-1 font-normal">
                        {dayjs(`2000-01-01T${task.startTime}`).format('h:mma')}
                      </span>
                    )}
                    {task.title}
                  </div>
                ))}

                {overflowCount > 0 && (
                  <div
                    onClick={e => { e.stopPropagation(); handleCellClick(d.dateStr); }}
                    className="text-[11px] text-blue-600 font-medium px-1 py-px hover:bg-blue-100 rounded cursor-pointer transition-colors"
                  >
                    +{overflowCount} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
