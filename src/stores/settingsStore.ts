import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, CalendarView } from '@/types/settings';

interface SettingsStore {
  theme: Theme;
  sidebarCollapsed: boolean;
  defaultCalendarView: CalendarView;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDefaultCalendarView: (view: CalendarView) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      defaultCalendarView: 'month',
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setDefaultCalendarView: (view) => set({ defaultCalendarView: view }),
    }),
    { name: 'daily-planner-settings' },
  ),
);
