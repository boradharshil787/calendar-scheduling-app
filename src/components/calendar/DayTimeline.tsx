"use client"

import React, { useMemo, useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Maximize2 } from 'lucide-react';

export interface TimelineTask {
  id: string;
  title: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  color?: string;    // Tailwind bg/text/border classes
}

interface DayTimelineProps {
  date: string;
  tasks: TimelineTask[];
  onTimeSlotClick?: (time: string, title: string) => void;
  onTimeSlotDoubleClick?: (time: string) => void;
  onTaskClick?: (task: TimelineTask) => void;
  rowHeight?: number; // px per hour, default 64
}

const HOUR_HEIGHT = 64; // px per hour — matches GCal density

function getTimeFromY(y: number, rowHeight: number): string {
  const totalMins = Math.floor((y / rowHeight) * 60);
  const hour = Math.min(23, Math.max(0, Math.floor(totalMins / 60)));
  const min  = Math.floor((totalMins % 60) / 30) * 30; // snap to 30m slots
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function formatHourLabel(hour: number): string {
  if (hour === 0)  return '12 AM';
  if (hour < 12)   return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

export function DayTimeline({
  date,
  tasks,
  onTimeSlotClick,
  onTimeSlotDoubleClick,
  onTaskClick,
  rowHeight = HOUR_HEIGHT,
}: DayTimelineProps) {
  const [draftTask, setDraftTask] = useState<{ timeStr: string; startMins: number } | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [nowMins, setNowMins] = useState(() =>
    dayjs().diff(dayjs().startOf('day'), 'minute')
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep current-time indicator current
  useEffect(() => {
    const id = setInterval(() => {
      setNowMins(dayjs().diff(dayjs().startOf('day'), 'minute'));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // On mount, scroll to ~1hr before current time so it's in view
  useEffect(() => {
    if (scrollRef.current) {
      const topPx = ((nowMins - 60) / 60) * rowHeight;
      scrollRef.current.scrollTop = Math.max(0, topPx);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const baseDay = dayjs(date).startOf('day');
  const isToday = baseDay.isSame(dayjs(), 'day');

  // ── Overlap resolution: true column-fraction layout ──────────────────────
  const positionedTasks = useMemo(() => {
    const parsed = tasks
      .map(t => {
        const startMins = dayjs(t.startTime).diff(baseDay, 'minute');
        let endMins     = dayjs(t.endTime).diff(baseDay, 'minute');
        if (endMins <= startMins) endMins = startMins + 30;
        if (endMins > 1440)       endMins = 1440;
        return { ...t, startMins, endMins };
      })
      .filter(t => t.startMins < 1440 && t.endMins > 0);

    // Sort: earlier start first, longer duration first on ties
    parsed.sort((a, b) =>
      a.startMins !== b.startMins
        ? a.startMins - b.startMins
        : (b.endMins - b.startMins) - (a.endMins - a.startMins)
    );

    // Greedy column assignment
    const columns: typeof parsed[] = [];
    for (const task of parsed) {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const last = columns[i][columns[i].length - 1];
        if (task.startMins >= last.endMins) {
          columns[i].push(task);
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([task]);
    }

    const numCols = columns.length || 1;

    // Assign column index + total columns to each task for proper left/width calc
    return columns.flatMap((col, colIndex) =>
      col.map(task => ({ ...task, colIndex, numCols }))
    );
  }, [tasks, date]);

  // ── Click handlers ────────────────────────────────────────────────────────
  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onTimeSlotClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const timeStr = getTimeFromY(e.clientY - rect.top, rowHeight);
    const [h, m] = timeStr.split(':').map(Number);
    setDraftTask({ timeStr, startMins: h * 60 + m });
    setDraftTitle('');
  };

  const handleGridDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onTimeSlotDoubleClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const timeStr = getTimeFromY(e.clientY - rect.top, rowHeight);
    setDraftTask(null);
    onTimeSlotDoubleClick(timeStr);
  };

  const commitDraft = () => {
    if (draftTitle.trim() && onTimeSlotClick && draftTask) {
      onTimeSlotClick(draftTask.timeStr, draftTitle.trim());
    }
    setDraftTask(null);
  };

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Scrollable timeline body ─────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex" style={{ minHeight: rowHeight * 24 }}>

          {/* ── Time axis ───────────────────────────────────────────────── */}
          <div className="w-16 shrink-0 select-none" style={{ position: 'relative', height: rowHeight * 24 }}>
            {hours.map(hour => (
              <div
                key={hour}
                className="absolute right-2 text-[11px] font-medium text-gray-400"
                style={{ top: hour * rowHeight - 7 }}
              >
                {/* Show midnight label only at very top, others are standard */}
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* ── Grid + events ───────────────────────────────────────────── */}
          <div
            className="flex-1 relative cursor-pointer border-l border-gray-100"
            style={{ height: rowHeight * 24 }}
            onClick={handleGridClick}
            onDoubleClick={handleGridDoubleClick}
          >
            {/* Full-hour lines */}
            {hours.map(hour => (
              <div
                key={`h-${hour}`}
                className="absolute w-full border-t border-gray-200 pointer-events-none"
                style={{ top: hour * rowHeight }}
              />
            ))}

            {/* Half-hour lines (lighter, like GCal) */}
            {hours.map(hour => (
              <div
                key={`hh-${hour}`}
                className="absolute w-full border-t border-gray-100 border-dashed pointer-events-none"
                style={{ top: hour * rowHeight + rowHeight / 2 }}
              />
            ))}

            {/* ── Task blocks ─────────────────────────────────────────── */}
            {positionedTasks.map(task => {
              const top    = (task.startMins / 60) * rowHeight;
              const height = Math.max(22, ((task.endMins - task.startMins) / 60) * rowHeight);

              // True column fraction: each column gets an equal share of the width
              // with a small right-margin so adjacent tasks don't touch
              const colW   = 100 / task.numCols;
              const left   = colW * task.colIndex;
              const width  = task.numCols === 1 ? 'calc(100% - 8px)' : `calc(${colW}% - 4px)`;

              const durationMins = task.endMins - task.startMins;
              const isCompact = durationMins <= 30;

              return (
                <div
                  key={task.id}
                  onClick={e => { e.stopPropagation(); onTaskClick?.(task); }}
                  className={`absolute rounded-lg border-l-4 px-2 py-1 cursor-pointer overflow-hidden
                    transition-all duration-150 hover:brightness-95 hover:shadow-md z-10 hover:z-20
                    ${task.color || 'bg-blue-50 border-blue-500 text-blue-900'}`}
                  style={{ top, height, left: `${left}%`, width, marginLeft: task.colIndex === 0 ? '4px' : '2px' }}
                >
                  <div className={`font-semibold leading-tight ${isCompact ? 'text-xs' : 'text-sm'} truncate`}>
                    {task.title}
                  </div>
                  {!isCompact && (
                    <div className="text-[11px] opacity-70 mt-0.5 truncate">
                      {dayjs(task.startTime).format('h:mm')}–{dayjs(task.endTime).format('h:mm A')}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Current time red line (today only) ──────────────────── */}
            {isToday && (
              <div
                className="absolute w-full z-20 pointer-events-none"
                style={{ top: (nowMins / 60) * rowHeight }}
              >
                <div className="relative flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0 -ml-[5px] shadow" />
                  <div className="flex-1 border-t-2 border-red-500" />
                </div>
              </div>
            )}

            {/* ── Quick-entry draft input ──────────────────────────────── */}
            {draftTask && (
              <div
                className="absolute z-30 bg-white border-2 border-blue-500 rounded-lg shadow-lg ring-2 ring-blue-200 ring-offset-1"
                style={{
                  top:    (draftTask.startMins / 60) * rowHeight,
                  height: Math.max(32, rowHeight / 2),
                  left:   '4px',
                  right:  '4px',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center h-full px-2 gap-1">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Event title"
                    value={draftTitle}
                    onChange={e => setDraftTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  { commitDraft(); }
                      if (e.key === 'Escape') { setDraftTask(null); }
                    }}
                    onBlur={commitDraft}
                    className="flex-1 h-full text-sm font-medium border-none outline-none bg-transparent placeholder-gray-300"
                  />
                  <button
                    type="button"
                    title="Open full editor"
                    onMouseDown={e => {
                      e.preventDefault(); // prevent blur from firing first
                      setDraftTask(null);
                      onTimeSlotDoubleClick?.(draftTask.timeStr);
                    }}
                    className="p-1 rounded text-blue-500 hover:bg-blue-50 transition-colors shrink-0"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
