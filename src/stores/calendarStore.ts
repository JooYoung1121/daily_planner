import { create } from 'zustand';
import type { CalendarView } from '@/types/settings';

interface CalendarStore {
  currentDate: Date;
  view: CalendarView;
  setCurrentDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
}

export const useCalendarStore = create<CalendarStore>()((set) => ({
  currentDate: new Date(),
  view: 'month',
  setCurrentDate: (date) => set({ currentDate: date }),
  setView: (view) => set({ view }),
}));
