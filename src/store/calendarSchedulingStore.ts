import { create } from 'zustand';
import { isSameDay, parseISO, getDay } from 'date-fns';

export type ViewMode = 'year' | 'month' | 'day';
export type PriorityTag = 'urgent' | 'personal' | 'work';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO string representing the start/base date
  startTime?: string; // HH:mm format
  endTime?: string; // HH:mm format
  priority: PriorityTag[];
  repeatDays?: Weekday[]; // Array of weekdays the task repeats on
  reminderTime?: string; // ISO string for precise reminder
}

export interface CalendarSchedulingStore {
  // Calendar State
  view: ViewMode;
  selectedDate: string; // ISO string
  setView: (view: ViewMode) => void;
  setSelectedDate: (date: string) => void;

  // Task State
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updatedTask: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // Custom Selectors/Methods
  filterTasksByDate: (dateStr: string) => Task[];
}

export const useCalendarSchedulingStore = create<CalendarSchedulingStore>((set, get) => ({
  view: 'month',
  selectedDate: new Date().toISOString(),
  setView: (view) => set({ view }),
  setSelectedDate: (date) => set({ selectedDate: date }),

  tasks: [],
  
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, task] 
  })),
  
  updateTask: (id, updatedTask) => set((state) => ({
    tasks: state.tasks.map((task) => 
      task.id === id ? { ...task, ...updatedTask } : task
    )
  })),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== id)
  })),

  // Evaluates tasks against a specific date including recurrence rules
  filterTasksByDate: (targetDateStr: string) => {
    const { tasks } = get();
    const targetDate = parseISO(targetDateStr);
    const targetWeekday = getDay(targetDate);

    return tasks.filter((task) => {
      const taskDate = parseISO(task.date);

      // 1. Direct date match (Non-recurring or specific instance)
      if (isSameDay(taskDate, targetDate)) {
        return true;
      }

      // 2. Recurring logic match
      // First ensure the target date is on or after the original task start date
      const taskStartOfDate = new Date(taskDate);
      taskStartOfDate.setHours(0, 0, 0, 0);
      
      if (targetDate.getTime() >= taskStartOfDate.getTime()) {
        // If it repeats on the target date's weekday, it's a match
        if (task.repeatDays && task.repeatDays.includes(targetWeekday as Weekday)) {
          return true;
        }
      }

      return false;
    });
  }
}));
