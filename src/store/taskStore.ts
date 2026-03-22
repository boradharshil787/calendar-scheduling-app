import { create } from 'zustand';
import { Task, PriorityTag } from '../types/task';

interface TaskStoreState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  filterTag: PriorityTag | 'all';
  isEditorOpen: boolean;
  editingTask: Partial<Task> | undefined;
  
  openEditor: (task?: Partial<Task>) => void;
  closeEditor: () => void;
  setFilterTag: (tag: PriorityTag | 'all') => void;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<Task>;
  updateTask: (id: string, updated: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  filterTag: 'all',
  isEditorOpen: false,
  editingTask: undefined,

  openEditor: (task) => set({ isEditorOpen: true, editingTask: task || {} }),
  closeEditor: () => set({ isEditorOpen: false, editingTask: undefined }),
  setFilterTag: (tag) => set({ filterTag: tag }),

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      set({ tasks: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addTask: async (taskData) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = { ...taskData, id: tempId } as Task;
    
    set((state) => ({ tasks: [...state.tasks, optimisticTask] }));

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (!res.ok) throw new Error('Failed to add task');
      
      const savedTask = await res.json();
      set((state) => ({
        tasks: state.tasks.map(t => t.id === tempId ? savedTask : t)
      }));
      return savedTask;
    } catch (err: any) {
      set((state) => ({
        tasks: state.tasks.filter(t => t.id !== tempId),
        error: err.message
      }));
      throw err;
    }
  },

  updateTask: async (id, updated) => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updated } : t)
    }));
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error('Failed to update task');
    } catch (err: any) {
      set({ tasks: previousTasks, error: err.message });
    }
  },

  deleteTask: async (id) => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter(t => t.id !== id)
    }));
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
    } catch (err: any) {
      set({ tasks: previousTasks, error: err.message });
    }
  },

  toggleTaskCompletion: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    await get().updateTask(id, { completed: !task.completed });
  }
}));
