"use client"

import { useEffect, useState } from "react"
import { useCalendarStore } from "@/store/calendarStore"
import { useTaskStore } from "@/store/taskStore"
import { DayTimeline } from "@/components/calendar/DayTimeline"
import { getTasksForDate } from "@/lib/recurrence/taskRecurrence"
import { Task } from "@/types/task"
import dayjs from "dayjs"

export default function DayPage() {
  const { currentDate } = useCalendarStore();
  const { tasks, fetchTasks, addTask, filterTag, openEditor } = useTaskStore();

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Priority Tag Filter
  const filteredTasks = filterTag === 'all' 
    ? tasks 
    : tasks.filter(t => t.priority?.includes(filterTag));

  // Extract precise tasks executing on exactly this Date via Recurrence Logic
  const todaysTasks = getTasksForDate(filteredTasks, currentDate.toISOString());

  // Map to unified Timeline Rendering format
  const timelineTasks = todaysTasks.map(t => {
    const startStr = t.startTime || "09:00"; 
    const endStr = t.endTime || "10:00";
    
    // Calculate precise layout absolute blocks
    const [sH, sM] = startStr.split(':').map(Number);
    const startIso = dayjs(currentDate).hour(sH).minute(sM).toISOString();
    
    const [eH, eM] = endStr.split(':').map(Number);
    const endIso = dayjs(currentDate).hour(eH).minute(eM).toISOString();

    let color = 'bg-blue-50 border-blue-500 text-blue-900';
    if (t.priority?.includes('urgent'))  color = 'bg-red-50 border-red-500 text-red-900';
    else if (t.priority?.includes('personal')) color = 'bg-purple-50 border-purple-500 text-purple-900';
    else if (t.priority?.includes('work'))     color = 'bg-emerald-50 border-emerald-500 text-emerald-900';

    return {
      id: t.id,
      title: t.title,
      startTime: startIso,
      endTime: endIso,
      color,
      _rawTask: t 
    };
  });

  const handleTimeSlotClick = (timeStr: string, title?: string) => {
    if (!title) return;
    const [hour, minute] = timeStr.split(':');
    const newDueDate = dayjs(currentDate).toISOString();
    
    addTask({
      title,
      completed: false,
      dueDate: newDueDate,
      startTime: `${hour}:${minute}`,
      endTime: dayjs().hour(Number(hour)).minute(Number(minute)).add(1, 'hour').format('HH:mm')
    });
  };

  const handleTimeSlotDoubleClick = (timeStr: string) => {
    openEditor({
      title: "",
      dueDate: currentDate.toISOString(),
      startTime: timeStr,
      endTime: dayjs(`2000-01-01 ${timeStr}`).add(1, 'hour').format('HH:mm'),
      completed: false
    });
  };

  const handleExistingTaskClick = (timelineTask: any) => {
    openEditor(timelineTask._rawTask);
  }

  return (
    <div className="h-full">
      <DayTimeline
        date={currentDate.toISOString()}
        tasks={timelineTasks}
        onTimeSlotClick={handleTimeSlotClick}
        onTimeSlotDoubleClick={handleTimeSlotDoubleClick}
        onTaskClick={handleExistingTaskClick}
      />
    </div>
  )
}
