import Dexie, { type Table } from 'dexie';
import type { Task, ScheduleItem } from '@/types/task';
import type { DailyLogEntry } from '@/types/dailyLog';
import type { MilestoneItem } from '@/types/milestone';

class DailyPlannerDB extends Dexie {
  tasks!: Table<Task>;
  dailyLogs!: Table<DailyLogEntry>;
  scheduleItems!: Table<ScheduleItem>;
  milestones!: Table<MilestoneItem>;

  constructor() {
    super('DailyPlannerDB');

    this.version(1).stores({
      tasks: 'id, status, priority, dueDate, category, createdAt, sortOrder',
      dailyLogs: 'id, &date, createdAt',
    });

    this.version(2).stores({
      tasks: 'id, status, priority, dueDate, category, createdAt, sortOrder, parentId',
      dailyLogs: 'id, &date, createdAt',
      scheduleItems: 'id, date, time, taskId',
    }).upgrade((tx) => {
      return tx.table('tasks').toCollection().modify((task) => {
        if (task.status === 'todo') task.status = 'open';
        if (task.status === 'done') task.status = 'closed';
        if (!task.parentId) task.parentId = null;
        if (!task.subtasks) task.subtasks = [];
        if (!task.recurrence) task.recurrence = null;
        if (!task.recurrenceSourceId) task.recurrenceSourceId = null;
      });
    });

    this.version(3).stores({
      tasks: 'id, status, priority, dueDate, category, createdAt, sortOrder, parentId',
      dailyLogs: 'id, &date, createdAt',
      scheduleItems: 'id, date, time, taskId',
      milestones: 'id, category, createdAt',
    });
  }
}

export const db = new DailyPlannerDB();
