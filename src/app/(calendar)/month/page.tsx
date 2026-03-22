"use client"

import { useEffect } from "react"
import { useCalendarStore } from "@/store/calendarStore"
import { useTaskStore } from "@/store/taskStore"
import { MonthGrid } from "@/components/calendar/MonthGrid"
import { useRouter } from "next/navigation"
import { Task } from "@/types/task"
import dayjs from "dayjs"

export default function MonthPage() {
  const { currentDate, setSelectedDate, setCurrentDate } = useCalendarStore();
  const { tasks, fetchTasks, filterTag, openEditor } = useTaskStore();
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = filterTag === 'all' 
    ? tasks 
    : tasks.filter(t => t.priority?.includes(filterTag));

  const handleDateClick = (dateStr: string) => {
    // Use dayjs to safely parse YYYY-MM-DD without timezone shift
    const parsed = dayjs(dateStr).toDate();
    setSelectedDate(parsed);
    setCurrentDate(parsed);
    router.push('/day');
  };

  const handleTaskClick = (task: Task) => {
    openEditor(task);
  };

  return (
    <div className="h-full p-4">
      <MonthGrid 
        currentDate={currentDate.toISOString()} 
        tasks={filteredTasks}
        onDateClick={handleDateClick}
        onTaskClick={handleTaskClick}
      />
    </div>
  )
}
