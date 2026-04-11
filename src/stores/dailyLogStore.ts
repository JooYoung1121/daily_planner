import { create } from 'zustand';
import { db } from '@/db/database';
import type { DailyLogEntry, Mood } from '@/types/dailyLog';

interface DailyLogStore {
  entries: DailyLogEntry[];
  isLoading: boolean;

  loadEntries: () => Promise<void>;
  getEntryByDate: (date: string) => DailyLogEntry | undefined;
  saveEntry: (date: string, content: string, mood?: Mood) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useDailyLogStore = create<DailyLogStore>()((set, get) => ({
  entries: [],
  isLoading: false,

  loadEntries: async () => {
    set({ isLoading: true });
    const entries = await db.dailyLogs.orderBy('date').reverse().toArray();
    set({ entries, isLoading: false });
  },

  getEntryByDate: (date) => {
    return get().entries.find((e) => e.date === date);
  },

  saveEntry: async (date, content, mood) => {
    const existing = get().entries.find((e) => e.date === date);
    const now = new Date().toISOString();

    if (existing) {
      const updates = { content, mood, updatedAt: now };
      await db.dailyLogs.update(existing.id, updates);
      set((s) => ({
        entries: s.entries.map((e) =>
          e.id === existing.id ? { ...e, ...updates } : e,
        ),
      }));
    } else {
      const entry: DailyLogEntry = {
        id: crypto.randomUUID(),
        date,
        content,
        mood,
        createdAt: now,
        updatedAt: now,
      };
      await db.dailyLogs.add(entry);
      set((s) => ({ entries: [entry, ...s.entries] }));
    }
  },

  deleteEntry: async (id) => {
    await db.dailyLogs.delete(id);
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
  },
}));
