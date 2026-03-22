import { create } from 'zustand';
import { ViewMode } from '../types/calendar';

interface CalendarStoreState {
  currentDate: Date;
  viewMode: ViewMode;
  selectedDate: Date | null;
  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: Date | null) => void;
}

export const useCalendarStore = create<CalendarStoreState>((set) => ({
  currentDate: new Date(),
  viewMode: 'month',
  selectedDate: null,
  setCurrentDate: (date) => set({ currentDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
