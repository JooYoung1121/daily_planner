export type Theme = 'light' | 'dark' | 'system';
export type CalendarView = 'day' | 'week' | 'month';

export interface SettingsState {
  theme: Theme;
  sidebarCollapsed: boolean;
  defaultCalendarView: CalendarView;
}
