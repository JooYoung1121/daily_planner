import { create } from 'zustand';
import { db } from '@/db/database';
import type { MilestoneItem, MilestoneStage } from '@/types/milestone';

interface MilestoneStore {
  items: MilestoneItem[];
  isLoading: boolean;

  loadMilestones: () => Promise<void>;
  addMilestone: (name: string, category: string, stageNames: string[]) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  updateMilestone: (id: string, updates: Partial<Pick<MilestoneItem, 'name' | 'category'>>) => Promise<void>;

  // Stage management
  moveToStage: (milestoneId: string, stageIndex: number) => Promise<void>;
  addStage: (milestoneId: string, name: string, insertAt?: number) => Promise<void>;
  removeStage: (milestoneId: string, stageId: string) => Promise<void>;
  updateStage: (milestoneId: string, stageId: string, updates: Partial<Pick<MilestoneStage, 'name' | 'description'>>) => Promise<void>;
}

export const useMilestoneStore = create<MilestoneStore>()((set, get) => ({
  items: [],
  isLoading: false,

  loadMilestones: async () => {
    set({ isLoading: true });
    const items = await db.milestones.toArray();
    // Migration: add currentStageIndex if missing
    const migrated = items.map((item) => {
      if (item.currentStageIndex === undefined) {
        const firstIncomplete = item.stages.findIndex((s) => !s.done);
        return { ...item, currentStageIndex: firstIncomplete === -1 ? item.stages.length : firstIncomplete };
      }
      // Migration: add description to stages if missing
      const stages = item.stages.map((s) => ({
        ...s,
        description: s.description ?? '',
      }));
      return { ...item, stages };
    });
    set({ items: migrated, isLoading: false });
  },

  addMilestone: async (name, category, stageNames) => {
    const now = new Date().toISOString();
    const item: MilestoneItem = {
      id: crypto.randomUUID(),
      name,
      category,
      stages: stageNames.map((n) => ({ id: crypto.randomUUID(), name: n, description: '', done: false })),
      currentStageIndex: 0,
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

  updateMilestone: async (id, updates) => {
    const now = new Date().toISOString();
    await db.milestones.update(id, { ...updates, updatedAt: now });
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...updates, updatedAt: now } : i)),
    }));
  },

  moveToStage: async (milestoneId, stageIndex) => {
    const item = get().items.find((i) => i.id === milestoneId);
    if (!item) return;
    const now = new Date().toISOString();
    // Mark stages as done up to stageIndex
    const stages = item.stages.map((s, i) => ({
      ...s,
      done: i < stageIndex,
    }));
    const updates = { stages, currentStageIndex: stageIndex, updatedAt: now };
    await db.milestones.update(milestoneId, updates);
    set((s) => ({
      items: s.items.map((i) => (i.id === milestoneId ? { ...i, ...updates } : i)),
    }));
  },

  addStage: async (milestoneId, name, insertAt) => {
    const item = get().items.find((i) => i.id === milestoneId);
    if (!item) return;
    const newStage: MilestoneStage = { id: crypto.randomUUID(), name, description: '', done: false };
    const stages = [...item.stages];
    if (insertAt !== undefined) {
      stages.splice(insertAt, 0, newStage);
    } else {
      stages.push(newStage);
    }
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
    const currentStageIndex = Math.min(item.currentStageIndex, stages.length);
    const now = new Date().toISOString();
    await db.milestones.update(milestoneId, { stages, currentStageIndex, updatedAt: now });
    set((s) => ({
      items: s.items.map((i) => (i.id === milestoneId ? { ...i, stages, currentStageIndex, updatedAt: now } : i)),
    }));
  },

  updateStage: async (milestoneId, stageId, updates) => {
    const item = get().items.find((i) => i.id === milestoneId);
    if (!item) return;
    const stages = item.stages.map((s) => (s.id === stageId ? { ...s, ...updates } : s));
    const now = new Date().toISOString();
    await db.milestones.update(milestoneId, { stages, updatedAt: now });
    set((s) => ({
      items: s.items.map((i) => (i.id === milestoneId ? { ...i, stages, updatedAt: now } : i)),
    }));
  },
}));
