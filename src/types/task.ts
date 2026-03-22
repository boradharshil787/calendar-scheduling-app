export type PriorityTag = 'urgent' | 'personal' | 'work';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate: Date | string; // Base layout date
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  priority?: PriorityTag[];
  repeatDays?: Weekday[];
  reminderTime?: string; // ISO string
}
