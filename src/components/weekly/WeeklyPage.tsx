import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTaskStore } from '@/stores/taskStore';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormDialog, type TaskFormData } from '@/components/tasks/TaskFormDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { cn } from '@/lib/utils';
import { toDateString } from '@/lib/date';
import type { Task } from '@/types/task';

export function WeeklyPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const day of days) {
      const dateStr = toDateString(day);
      map[dateStr] = tasks
        .filter((t) => t.dueDate === dateStr && !t.parentId)
        .sort((a, b) => {
          // Priority sort: high first
          const pOrder = { high: 0, medium: 1, low: 2 };
          return pOrder[a.priority] - pOrder[b.priority];
        });
    }
    return map;
  }, [tasks, days]);

  // Tasks without due date this week (based on creation date)
  const unscheduled = useMemo(() => {
    const weekStartStr = toDateString(currentWeekStart);
    const weekEndStr = toDateString(weekEnd);
    return tasks.filter(
      (t) => !t.parentId && !t.dueDate && t.status !== 'closed' &&
        t.createdAt.slice(0, 10) >= weekStartStr && t.createdAt.slice(0, 10) <= weekEndStr,
    );
  }, [tasks, currentWeekStart, weekEnd]);

  const handleSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await addTask({
        ...data,
        parentId: null,
        subtasks: [],
        recurrence: data.recurrence ?? null,
        recurrenceSourceId: null,
      });
    }
    setEditingTask(null);
  };

  const weekLabel = `${format(currentWeekStart, 'M월 d일', { locale: ko })} — ${format(weekEnd, 'M월 d일', { locale: ko })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">주간 보기</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-foreground min-w-[160px] text-center">{weekLabel}</span>
          <button onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
            <ChevronRight size={20} />
          </button>
          <button
            onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            이번 주
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dateStr = toDateString(day);
          const dayTasks = tasksByDay[dateStr] || [];
          const today = isToday(day);

          return (
            <div
              key={dateStr}
              className={cn(
                'rounded-lg border border-border bg-card min-h-[200px] flex flex-col',
                today && 'border-primary/50 bg-primary/5',
              )}
            >
              {/* Day header */}
              <div className={cn('px-2.5 py-2 border-b border-border text-center', today && 'bg-primary/10')}>
                <p className="text-[10px] text-muted-foreground">{format(day, 'EEE', { locale: ko })}</p>
                <p className={cn('text-lg font-bold', today ? 'text-primary' : 'text-foreground')}>{format(day, 'd')}</p>
              </div>

              {/* Tasks */}
              <div className="flex-1 p-1.5 space-y-1 overflow-y-auto max-h-[300px]">
                {dayTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setEditingTask(task);
                      setFormOpen(true);
                    }}
                    className={cn(
                      'w-full text-left rounded-md px-2 py-1.5 text-[11px] font-medium border transition-colors hover:bg-accent/50',
                      task.status === 'closed' ? 'opacity-50 line-through border-green-200 dark:border-green-900' :
                      task.priority === 'high' ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30' :
                      'border-border',
                    )}
                  >
                    <span className="line-clamp-2">{task.title}</span>
                    {task.category && (
                      <span className="block text-[9px] text-muted-foreground mt-0.5">{task.category}</span>
                    )}
                  </button>
                ))}
                {dayTasks.length === 0 && (
                  <button
                    onClick={() => { setSelectedDate(dateStr); setEditingTask(null); setFormOpen(true); }}
                    className="w-full rounded-md py-4 text-[10px] text-muted-foreground/50 hover:bg-accent/30 hover:text-muted-foreground"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unscheduled tasks */}
      {unscheduled.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">미배정 업무 (이번 주 생성)</h2>
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
            {unscheduled.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                compact
                onEdit={(t) => { setEditingTask(t); setFormOpen(true); }}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        </div>
      )}

      <TaskFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingTask(null); }}
        onSubmit={handleSubmit}
        task={editingTask}
        defaultDate={selectedDate ?? undefined}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) await deleteTask(deleteId); setDeleteId(null); }}
        title="업무 삭제"
        description="이 업무를 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="destructive"
      />
    </div>
  );
}
