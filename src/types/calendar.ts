export type ViewMode = 'day' | 'month' | 'year';

export interface CalendarState {
  currentDate: Date;
  viewMode: ViewMode;
  selectedDate: Date | null;
}
