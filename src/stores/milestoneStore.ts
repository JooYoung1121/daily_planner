import { create } from 'zustand';
import { db } from '@/db/database';
import type { MilestoneItem } from '@/types/milestone';

interface MilestoneStore {
  items: MilestoneItem[];
  isLoading: boolean;

  loadMilestones: () => Promise<void>;
  addMilestone: (name: string, category: string, stageNames: string[]) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  toggleStage: (milestoneId: string, stageId: string) => Promise<void>;
  addStage: (milestoneId: string, stageName: string) => Promise<void>;
  removeStage: (milestoneId: string, stageId: string) => Promise<void>;
  updateMilestone: (id: string, updates: Partial<Pick<MilestoneItem, 'name' | 'category'>>) => Promise<void>;
}

export const useMilestoneStore = create<MilestoneStore>()((set, get) => ({
  items: [],
  isLoading: false,

  loadMilestones: async () => {
    set({ isLoading: true });
    const items = await db.milestones.toArray();
    set({ items, isLoading: false });
  },

  addMilestone: async (name, category, stageNames) => {
    const now = new Date().toISOString();
    const item: MilestoneItem = {
      id: crypto.randomUUID(),
      name,
      category,
      stages: stageNames.map((n) => ({ id: crypto.randomUUID(), name: n, done: false })),
      createdAt: now,
      updatedAt: now,
    };
    await db.milestones.add(item);
    set((s) => ({ items: [...s.items, item] }));
  },

  deleteMilestone: async (id) => {
    await db.milestones.delete(id);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  toggleStage: async (milestoneId, stageId) => {
    const item = get().items.find((i) => i.id === milestoneId);
    if (!item) return;
    const stages = item.stages.map((s) =>
      s.id === stageId ? { ...s, done: !s.done } : s,
    );
    const now = new Date().toISOString();
    await db.milestones.update(milestoneId, { stages, updatedAt: now });
    set((s) => ({
      items: s.items.map((i) => (i.id === milestoneId ? { ...i, stages, updatedAt: now } : i)),
    }));
  },

  addStage: async (milestoneId, stageName) => {
    const item = get().items.find((i) => i.id === milestoneId);
    if (!item) return;
    const stages = [...item.stages, { id: crypto.randomUUID(), name: stageName, done: false }];
    const now = new Date().toISOString();
    await db.milestones.update(milestoneId, { stages, updatedAt: now });
    set((s) => ({
      items: s.items.map((i) => (i.id === milestoneId ? { ...i, stages, updatedAt: now } : i)),
    }));
  },

  removeStage: async (milestoneId, stageId) => {
    const item = get().items.find((i) => i.id === milestoneId);
    if (!item) return;
    const stages = item.stages.filter((s) => s.id !== stageId);
    const now = new Date().toISOString();
    await db.milestones.update(milestoneId, { stages, updatedAt: now });
    set((s) => ({
      items: s.items.map((i) => (i.id === milestoneId ? { ...i, stages, updatedAt: now } : i)),
    }));
  },

  updateMilestone: async (id, updates) => {
    const now = new Date().toISOString();
    await db.milestones.update(id, { ...updates, updatedAt: now });
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...updates, updatedAt: now } : i)),
    }));
  },
}));
