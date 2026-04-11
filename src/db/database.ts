import Dexie, { type Table } from 'dexie';
import type { Task } from '@/types/task';
import type { DailyLogEntry } from '@/types/dailyLog';

class DailyPlannerDB extends Dexie {
  tasks!: Table<Task>;
  dailyLogs!: Table<DailyLogEntry>;

  constructor() {
    super('DailyPlannerDB');
    this.version(1).stores({
      tasks: 'id, status, priority, dueDate, category, createdAt, sortOrder',
      dailyLogs: 'id, &date, createdAt',
    });
  }
}

export const db = new DailyPlannerDB();
