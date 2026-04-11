import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, CalendarView } from '@/types/settings';

export interface TemplateItem {
  id: string;
  category: string;
  title: string;
  content: string;
  url?: string;
}

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
  { id: '1', name: '크리에이터', color: '#8b5cf6' },
  { id: '2', name: '콘텐츠', color: '#3b82f6' },
  { id: '3', name: 'CRM', color: '#10b981' },
  { id: '4', name: '퍼포먼스', color: '#f59e0b' },
  { id: '5', name: '촬영', color: '#ef4444' },
  { id: '6', name: '바이럴', color: '#ec4899' },
  { id: '7', name: '개인/행정', color: '#6b7280' },
];

export interface CustomNavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  visible: boolean;
  notes?: string; // JSON stringified notes array
}

interface SettingsStore {
  theme: Theme;
  sidebarCollapsed: boolean;
  defaultCalendarView: CalendarView;
  categories: CategoryItem[];
  routines: RoutineItem[];
  templates: TemplateItem[];
  navOrder: string[]; // ordered path list e.g. ['/', '/today', ...]
  customPages: CustomNavItem[];
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
  setTemplates: (templates: TemplateItem[]) => void;
  dismissedGuides: string[];
  setDismissedGuides: (guides: string[]) => void;
  setNavOrder: (order: string[]) => void;
  addCustomPage: (label: string, icon: string) => void;
  removeCustomPage: (id: string) => void;
  updateCustomPage: (id: string, updates: Partial<Omit<CustomNavItem, 'id'>>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      defaultCalendarView: 'month',
      categories: DEFAULT_CATEGORIES,
      routines: [],
      templates: [],
      navOrder: [],
      customPages: [],
      dismissedGuides: [],
      setDismissedGuides: (guides) => set({ dismissedGuides: guides }),
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
      setTemplates: (templates) => set({ templates }),
      setNavOrder: (navOrder) => set({ navOrder }),
      addCustomPage: (label, icon) =>
        set((s) => {
          const id = crypto.randomUUID();
          const path = `/custom/${id}`;
          return {
            customPages: [...s.customPages, { id, label, path, icon, visible: true }],
          };
        }),
      removeCustomPage: (id) =>
        set((s) => ({ customPages: s.customPages.filter((p) => p.id !== id) })),
      updateCustomPage: (id, updates) =>
        set((s) => ({
          customPages: s.customPages.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
    }),
    { name: 'daily-planner-settings' },
  ),
);
