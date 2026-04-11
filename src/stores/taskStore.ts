import { create } from 'zustand';
import { db } from '@/db/database';
import type { Task, TaskStatus, TaskPriority } from '@/types/task';

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  category?: string;
}

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  filters: TaskFilters;

  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'sortOrder'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (status: TaskStatus, orderedIds: string[]) => Promise<void>;
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  getFilteredTasks: () => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByDate: (date: string) => Task[];
}

export const useTaskStore = create<TaskStore>()((set, get) => ({
  tasks: [],
  isLoading: false,
  filters: {},

  loadTasks: async () => {
    set({ isLoading: true });
    const tasks = await db.tasks.toArray();
    set({ tasks, isLoading: false });
  },

  addTask: async (taskData) => {
    const now = new Date().toISOString();
    const maxOrder = await db.tasks
      .where('status')
      .equals(taskData.status)
      .count();

    const task: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      sortOrder: (maxOrder + 1) * 1000,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };

    await db.tasks.add(task);
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask: async (id, updates) => {
    const now = new Date().toISOString();
    const finalUpdates = {
      ...updates,
      updatedAt: now,
      ...(updates.status === 'done' ? { completedAt: now } : {}),
      ...(updates.status && updates.status !== 'done' ? { completedAt: null } : {}),
    };

    await db.tasks.update(id, finalUpdates);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...finalUpdates } : t)),
    }));
  },

  deleteTask: async (id) => {
    await db.tasks.delete(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  reorderTasks: async (_status, orderedIds) => {
    const updates = orderedIds.map((id, index) => ({
      key: id,
      changes: { sortOrder: (index + 1) * 1000, updatedAt: new Date().toISOString() },
    }));

    await Promise.all(
      updates.map(({ key, changes }) => db.tasks.update(key, changes)),
    );

    set((s) => ({
      tasks: s.tasks.map((t) => {
        const update = updates.find((u) => u.key === t.id);
        return update ? { ...t, ...update.changes } : t;
      }),
    }));
  },

  setFilters: (filters) =>
    set((s) => ({ filters: { ...s.filters, ...filters } })),

  clearFilters: () => set({ filters: {} }),

  getFilteredTasks: () => {
    const { tasks, filters } = get();
    return tasks.filter((t) => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.description.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  },

  getTasksByStatus: (status) => {
    return get()
      .tasks.filter((t) => t.status === status)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getTasksByDate: (date) => {
    return get().tasks.filter((t) => t.dueDate === date);
  },
}));
