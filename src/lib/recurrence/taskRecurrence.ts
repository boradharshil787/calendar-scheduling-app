import { Task, Weekday } from '@/types/task';
import dayjs from 'dayjs';

// Pre-calculate target day and weekday for performance loops
export interface PrecomputedTarget {
  dayStr: string;
  weekday: number;
}

// Memory-safe cache for parsed task due dates since Zustand tasks are immutable
const taskDueDateCache = new WeakMap<Task, string>();

export function isTaskOnDate(
  task: Task, 
  targetDateStr: string,
  precomputedTarget?: PrecomputedTarget
): boolean {
  // 1. Fast path for target day representation
  const targetDay = precomputedTarget 
    ? precomputedTarget.dayStr 
    : dayjs(targetDateStr).format('YYYY-MM-DD');
  
  // 2. Fast path for task day representation using WeakMap cache
  let taskDay = taskDueDateCache.get(task);
  if (!taskDay) {
    taskDay = dayjs(task.dueDate).format('YYYY-MM-DD');
    taskDueDateCache.set(task, taskDay);
  }

  // Exact match
  if (taskDay === targetDay) {
    return true;
  }

  // No recurrence — one-time task
  if (!task.repeatDays || task.repeatDays.length === 0) {
    return false;
  }

  // Chronology guard: recurring tasks must not render BEFORE their origin date
  if (targetDay < taskDay) {
    return false;
  }

  // Recurrence check: does targetDay fall on one of the repeat weekdays?
  const targetWeekday = precomputedTarget 
    ? precomputedTarget.weekday 
    : dayjs(targetDay).day(); // 0=Sun … 6=Sat

  return task.repeatDays.includes(targetWeekday as Weekday);
}

export function getTasksForDate(tasks: Task[], targetDateStr: string): Task[] {
  // Performance optimization: 
  // Parse the target date ONCE instead of `tasks.length` times inside the loop.
  const parsedTargetJs = dayjs(targetDateStr);
  const precomputed: PrecomputedTarget = {
    dayStr: parsedTargetJs.format('YYYY-MM-DD'),
    weekday: parsedTargetJs.day()
  };

  return tasks.filter((task) => isTaskOnDate(task, targetDateStr, precomputed));
}
