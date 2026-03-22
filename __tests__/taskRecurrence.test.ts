import { describe, it, expect } from 'vitest';
import { isTaskOnDate } from '../src/lib/recurrence/taskRecurrence';
import { Task } from '../src/types/task';
describe('taskRecurrence chronological purity', () => {
  it('identifies exact date match correctly independent of repeat rules', () => {
    const task: Task = { id: '1', title: 'Test', completed: false, dueDate: '2026-03-21T10:00:00.000Z' };
    expect(isTaskOnDate(task, '2026-03-21T15:00:00.000Z')).toBe(true);
    expect(isTaskOnDate(task, '2026-03-22T10:00:00.000Z')).toBe(false);
  });

  it('safeguards recurring days from rendering before the tasks origin conception date', () => {
    // 2026-03-21 is a Saturday (6)
    const task: Task = { 
      id: '2', title: 'Test', completed: false, 
      dueDate: '2026-03-21T10:00:00.000Z',
      repeatDays: [3] // Task repeats exclusively on Wednesdays
    };
    
    // The very next Wednesday after start date -> Should exist
    expect(isTaskOnDate(task, '2026-03-25T10:00:00.000Z')).toBe(true);
    
    // A valid Wednesday, BUT temporally existing BEFORE the user actually created the recurring task!
    // March 18 was a Wednesday, but since it is before March 21, it should absolutely NOT exist.
    expect(isTaskOnDate(task, '2026-03-18T10:00:00.000Z')).toBe(false);
  });

  it('handles infinite single-off tasks gracefully without breaking', () => {
    const task: Task = { id: '3', title: 'Test', completed: false, dueDate: '2026-03-21T10:00:00.000Z', repeatDays: [] };
    expect(isTaskOnDate(task, '2026-03-28T10:00:00.000Z')).toBe(false);
  });
});
