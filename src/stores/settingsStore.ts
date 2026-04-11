import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, CalendarView } from '@/types/settings';

export interface CategoryItem {
  id: string;
  name: string;
  color: string;
}

export interface RoutineItem {
  id: string;
  time: string; // HH:mm
  title: string;
  enabled: boolean;
  days: number[]; // 0=Sun, 1=Mon, ... 6=Sat. empty = every day
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: '1', name: '개발', color: '#3b82f6' },
  { id: '2', name: '미팅', color: '#8b5cf6' },
  { id: '3', name: '문서', color: '#10b981' },
  { id: '4', name: '리뷰', color: '#f59e0b' },
  { id: '5', name: '기타', color: '#6b7280' },
];

interface SettingsStore {
  theme: Theme;
  sidebarCollapsed: boolean;
  defaultCalendarView: CalendarView;
  categories: CategoryItem[];
  routines: RoutineItem[];
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDefaultCalendarView: (view: CalendarView) => void;
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, name: string, color: string) => void;
  deleteCategory: (id: string) => void;
  addRoutine: (time: string, title: string, days: number[]) => void;
  updateRoutine: (id: string, updates: Partial<Omit<RoutineItem, 'id'>>) => void;
  deleteRoutine: (id: string) => void;
  toggleRoutine: (id: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      defaultCalendarView: 'month',
      categories: DEFAULT_CATEGORIES,
      routines: [],
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setDefaultCalendarView: (view) => set({ defaultCalendarView: view }),
      addCategory: (name, color) =>
        set((s) => ({
          categories: [...s.categories, { id: crypto.randomUUID(), name, color }],
        })),
      updateCategory: (id, name, color) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, name, color } : c)),
        })),
      deleteCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
      addRoutine: (time, title, days) =>
        set((s) => ({
          routines: [...s.routines, { id: crypto.randomUUID(), time, title, enabled: true, days }],
        })),
      updateRoutine: (id, updates) =>
        set((s) => ({
          routines: s.routines.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),
      deleteRoutine: (id) =>
        set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
      toggleRoutine: (id) =>
        set((s) => ({
          routines: s.routines.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
        })),
    }),
    { name: 'daily-planner-settings' },
  ),
);
