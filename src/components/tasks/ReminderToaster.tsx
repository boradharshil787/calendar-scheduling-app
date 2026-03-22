"use client"

import { useEffect, useState } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { Bell, X } from 'lucide-react';
import dayjs from 'dayjs';
import { isTaskOnDate } from '@/lib/recurrence/taskRecurrence';

interface Toast {
  id: string;
  taskId: string;
  title: string;
  message: string;
  isMissed: boolean;
}

const NOTIFIED_KEY = 'cal_notified_reminders';

export function ReminderToaster() {
  const { tasks } = useTaskStore();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // 1. Load acknowledged IDs from localStorage
    const getAcknowledged = (): Set<string> => {
      try {
        const stored = localStorage.getItem(NOTIFIED_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
      } catch {
        return new Set();
      }
    };

    const markAcknowledged = (id: string, currentSet: Set<string>) => {
      currentSet.add(id);
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(currentSet)));
    };

    const playDing = () => {
      // Base64 short ding sound to avoid needing external assets
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=");
        audio.volume = 0.5;
        audio.play().catch(() => {}); // catch play() block exceptions
      } catch (e) {}
    };

    const checkReminders = () => {
      const now = dayjs();
      const todayStr = now.format('YYYY-MM-DD');
      const acknowledged = getAcknowledged();
      
      let newToastsAdded = false;

      tasks.forEach(task => {
        if (task.completed) return;
        
        const reminderValue = (task as any).reminderTime || (task as any).reminder;
        if (!reminderValue) return;

        // Calculate if the task actually occurs TODAY based on recurrence rules
        const isOnToday = isTaskOnDate(task, todayStr);
        if (!isOnToday) return;

        // Apply task's original reminder HH:mm to TODAY
        const originalReminder = dayjs(reminderValue);
        const todayReminder = now.hour(originalReminder.hour()).minute(originalReminder.minute()).second(0).millisecond(0);

        // Unique ID for this specific day's reminder (e.g., "task-123_2026-03-22")
        // This ensures recurring tasks fire exactly once per day their reminder is evaluated
        const reminderInstanceId = `${task.id}_${todayStr}`;
        if (acknowledged.has(reminderInstanceId)) return;

        // Check time window. diff is positive if 'now' is AFTER 'todayReminder'.
        const diffMs = now.diff(todayReminder, 'millisecond');
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;
        
        // It's time if the reminder was in the past 12 hours and hasn't been acknowledged.
        if (diffMs >= 0 && diffMs <= TWELVE_HOURS) {
          markAcknowledged(reminderInstanceId, acknowledged);
          newToastsAdded = true;
          
          const isMissed = diffMs > 60000;
          const newToast: Toast = {
            id: Math.random().toString(36).substr(2, 9),
            taskId: task.id,
            title: isMissed ? 'Missed Reminder' : 'Task Reminder',
            message: task.title,
            isMissed
          };
          
          setToasts(prev => [...prev, newToast]);

          // Auto-hide only fresh toasts (not missed ones) after 8s
          if (!isMissed) {
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== newToast.id));
            }, 8000);
          }
        }
      });

      if (newToastsAdded) {
        playDing();
      }
    };

    // Poll every 10 seconds
    const interval = setInterval(checkReminders, 10000);
    checkReminders(); // Initial check on mount
    
    return () => clearInterval(interval);
  }, [tasks]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`border rounded-xl shadow-xl p-4 w-80 flex items-start gap-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${toast.isMissed ? 'bg-orange-50 border-orange-200' : 'bg-white border-blue-100'}`}
        >
          <div className={`${toast.isMissed ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'} p-2 rounded-full shrink-0`}>
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-sm ${toast.isMissed ? 'text-orange-900' : 'text-gray-900'}`}>{toast.title}</h4>
            <p className={`text-sm truncate mt-0.5 ${toast.isMissed ? 'text-orange-800' : 'text-gray-600'}`}>{toast.message}</p>
          </div>
          <button 
            onClick={() => removeToast(toast.id)}
            className={`${toast.isMissed ? 'text-orange-400 hover:text-orange-600' : 'text-gray-400 hover:text-gray-600'} transition-colors shrink-0 p-0.5`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
