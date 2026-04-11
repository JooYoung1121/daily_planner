export type TaskStatus = 'open' | 'in-progress' | 'closed';
export type TaskPriority = 'high' | 'medium' | 'low';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly';

export interface Recurrence {
  type: RecurrenceType;
  interval: number; // every N days/weeks/months
  endDate?: string; // YYYY-MM-DD, optional end
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  tags: string[];
  dueDate: string | null;
  dueTime: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  // Subtasks
  parentId: string | null; // null = top-level (epic), string = child
  subtasks: SubTask[]; // quick checklist-style subtasks
  // Recurrence
  recurrence: Recurrence | null;
  recurrenceSourceId: string | null; // links to original recurring task
}

// Today schedule item
export interface ScheduleItem {
  id: string;
  time: string; // HH:mm
  title: string;
  done: boolean;
  taskId: string | null; // linked task, if any
  date: string; // YYYY-MM-DD
}
