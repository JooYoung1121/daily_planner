import { create } from 'zustand';
import { db } from '@/db/database';
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import type { Task, TaskStatus, TaskPriority, SubTask, ScheduleItem } from '@/types/task';

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  category?: string;
}

interface TaskStore {
  tasks: Task[];
  scheduleItems: ScheduleItem[];
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
  getTopLevelTasks: () => Task[];
  getChildTasks: (parentId: string) => Task[];

  // Subtasks (checklist style)
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;

  // Recurrence
  completeAndRecur: (id: string) => Promise<void>;

  // Schedule
  loadSchedule: (date: string) => Promise<void>;
  addScheduleItem: (item: Omit<ScheduleItem, 'id'>) => Promise<void>;
  updateScheduleItem: (id: string, updates: Partial<ScheduleItem>) => Promise<void>;
  deleteScheduleItem: (id: string) => Promise<void>;
  toggleScheduleItem: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>()((set, get) => ({
  tasks: [],
  scheduleItems: [],
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
      ...(updates.status === 'closed' ? { completedAt: now } : {}),
      ...(updates.status && updates.status !== 'closed' ? { completedAt: null } : {}),
    };

    await db.tasks.update(id, finalUpdates);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...finalUpdates } : t)),
    }));
  },

  deleteTask: async (id) => {
    // Also delete child tasks
    const children = get().tasks.filter((t) => t.parentId === id);
    for (const child of children) {
      await db.tasks.delete(child.id);
    }
    await db.tasks.delete(id);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id && t.parentId !== id),
    }));
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
      if (t.parentId) return false; // hide child tasks from main list
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  },

  getTasksByStatus: (status) =>
    get().tasks.filter((t) => t.status === status && !t.parentId).sort((a, b) => a.sortOrder - b.sortOrder),

  getTasksByDate: (date) =>
    get().tasks.filter((t) => t.dueDate === date),

  getTopLevelTasks: () =>
    get().tasks.filter((t) => !t.parentId),

  getChildTasks: (parentId) =>
    get().tasks.filter((t) => t.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder),

  // Subtasks (inline checklist)
  addSubtask: async (taskId, title) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const subtask: SubTask = { id: crypto.randomUUID(), title, done: false };
    const subtasks = [...task.subtasks, subtask];
    await db.tasks.update(taskId, { subtasks, updatedAt: new Date().toISOString() });
    set((s) => ({
      tasks: s.tasks.map((t) => t.id === taskId ? { ...t, subtasks } : t),
    }));
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const subtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, done: !st.done } : st,
    );
    await db.tasks.update(taskId, { subtasks, updatedAt: new Date().toISOString() });
    set((s) => ({
      tasks: s.tasks.map((t) => t.id === taskId ? { ...t, subtasks } : t),
    }));
  },

  deleteSubtask: async (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const subtasks = task.subtasks.filter((st) => st.id !== subtaskId);
    await db.tasks.update(taskId, { subtasks, updatedAt: new Date().toISOString() });
    set((s) => ({
      tasks: s.tasks.map((t) => t.id === taskId ? { ...t, subtasks } : t),
    }));
  },

  // Complete task and create next occurrence if recurring
  completeAndRecur: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    // Close current
    await get().updateTask(id, { status: 'closed' });

    // Create next if recurring
    if (task.recurrence && task.dueDate) {
      const { type, interval, endDate } = task.recurrence;
      const current = new Date(task.dueDate);
      let nextDate: Date;
      if (type === 'daily') nextDate = addDays(current, interval);
      else if (type === 'weekly') nextDate = addWeeks(current, interval);
      else if (type === 'weekdays') nextDate = addWeeks(current, 1); // next week same day
      else nextDate = addMonths(current, interval);

      const nextDateStr = format(nextDate, 'yyyy-MM-dd');
      if (!endDate || nextDateStr <= endDate) {
        await get().addTask({
          title: task.title,
          description: task.description,
          status: 'open',
          priority: task.priority,
          category: task.category,
          tags: task.tags,
          dueDate: nextDateStr,
          dueTime: task.dueTime,
          parentId: null,
          subtasks: task.subtasks.map((st) => ({ ...st, done: false })),
          recurrence: task.recurrence,
          recurrenceSourceId: task.recurrenceSourceId ?? task.id,
        });
      }
    }
  },

  // Schedule items
  loadSchedule: async (date) => {
    const items = await db.scheduleItems.where('date').equals(date).sortBy('time');
    set({ scheduleItems: items });
  },

  addScheduleItem: async (itemData) => {
    const item: ScheduleItem = { ...itemData, id: crypto.randomUUID() };
    await db.scheduleItems.add(item);
    set((s) => ({
      scheduleItems: [...s.scheduleItems, item].sort((a, b) => a.time.localeCompare(b.time)),
    }));
  },

  updateScheduleItem: async (id, updates) => {
    await db.scheduleItems.update(id, updates);
    set((s) => ({
      scheduleItems: s.scheduleItems
        .map((i) => (i.id === id ? { ...i, ...updates } : i))
        .sort((a, b) => a.time.localeCompare(b.time)),
    }));
  },

  deleteScheduleItem: async (id) => {
    await db.scheduleItems.delete(id);
    set((s) => ({ scheduleItems: s.scheduleItems.filter((i) => i.id !== id) }));
  },

  toggleScheduleItem: async (id) => {
    const item = get().scheduleItems.find((i) => i.id === id);
    if (!item) return;
    const done = !item.done;
    await db.scheduleItems.update(id, { done });
    set((s) => ({
      scheduleItems: s.scheduleItems.map((i) => (i.id === id ? { ...i, done } : i)),
    }));
  },
}));
