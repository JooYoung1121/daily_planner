import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTaskStore } from '@/stores/taskStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { TaskFormDialog, type TaskFormData } from '@/components/tasks/TaskFormDialog';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { cn } from '@/lib/utils';
import { toDateString, formatDate, getDday } from '@/lib/date';
import type { Task } from '@/types/task';

export function WeeklyPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const categories = useSettingsStore((s) => s.categories);

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const day of days) {
      const dateStr = toDateString(day);
      map[dateStr] = tasks
        .filter((t) => t.dueDate === dateStr && !t.parentId)
        .sort((a, b) => {
          const pOrder = { high: 0, medium: 1, low: 2 };
          return pOrder[a.priority] - pOrder[b.priority];
        });
    }
    return map;
  }, [tasks, days]);

  const unscheduled = useMemo(() => {
    const weekStartStr = toDateString(currentWeekStart);
    const weekEndStr = toDateString(weekEnd);
    return tasks.filter(
      (t) => !t.parentId && !t.dueDate && t.status !== 'closed' &&
        t.createdAt.slice(0, 10) >= weekStartStr && t.createdAt.slice(0, 10) <= weekEndStr,
    );
  }, [tasks, currentWeekStart, weekEnd]);

  const expandedTasks = expandedDate ? (tasksByDay[expandedDate] || []) : [];

  const handleSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await addTask({ ...data, parentId: null, subtasks: [], recurrence: data.recurrence ?? null, recurrenceSourceId: null });
    }
    setEditingTask(null);
  };

  const getCatColor = (name: string) => categories.find((c) => c.name === name)?.color;

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
          <button onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent">
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
              onClick={() => setExpandedDate(dateStr)}
              className={cn(
                'rounded-lg border border-border bg-card min-h-[200px] flex flex-col cursor-pointer transition-all hover:shadow-md hover:border-primary/30',
                today && 'border-primary/50 bg-primary/5',
              )}
            >
              <div className={cn('px-2.5 py-2 border-b border-border text-center', today && 'bg-primary/10')}>
                <p className="text-[10px] text-muted-foreground">{format(day, 'EEE', { locale: ko })}</p>
                <p className={cn('text-lg font-bold', today ? 'text-primary' : 'text-foreground')}>{format(day, 'd')}</p>
                {dayTasks.length > 0 && (
                  <p className="text-[10px] text-muted-foreground">{dayTasks.length}개</p>
                )}
              </div>
              <div className="flex-1 p-1.5 space-y-1 overflow-y-auto max-h-[300px]">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      'rounded-md px-2 py-1.5 text-[11px] font-medium border',
                      task.status === 'closed' ? 'opacity-50 line-through border-green-200 dark:border-green-900' :
                      task.priority === 'high' ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30' :
                      'border-border',
                    )}
                  >
                    <span className="line-clamp-2">{task.title}</span>
                    {task.category && (
                      <span className="block text-[9px] text-muted-foreground mt-0.5">{task.category}</span>
                    )}
                  </div>
                ))}
                {dayTasks.length === 0 && (
                  <div className="flex-1 flex items-center justify-center py-4">
                    <span className="text-[10px] text-muted-foreground/40">비어있음</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day detail popup */}
      {expandedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setExpandedDate(null)} />
          <div className="relative z-50 w-full max-w-lg max-h-[80vh] rounded-lg border border-border bg-card shadow-xl overflow-hidden flex flex-col">
            {/* Popup header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-base font-bold text-foreground">{formatDate(expandedDate)}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedDate(expandedDate); setEditingTask(null); setFormOpen(true); }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Plus size={16} />
                </button>
                <button onClick={() => setExpandedDate(null)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Popup body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {expandedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">이 날에 업무가 없습니다</p>
                  <button
                    onClick={() => { setSelectedDate(expandedDate); setEditingTask(null); setFormOpen(true); }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    <Plus size={14} /> 업무 추가
                  </button>
                </div>
              ) : (
                expandedTasks.map((task) => {
                  const dday = task.status !== 'closed' && task.dueDate ? getDday(task.dueDate) : null;
                  const catColor = task.category ? getCatColor(task.category) : undefined;

                  return (
                    <div
                      key={task.id}
                      onClick={() => { setSelectedTask(task); setExpandedDate(null); }}
                      className={cn(
                        'rounded-lg border border-border p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/30',
                        task.status === 'closed' && 'opacity-50',
                        task.priority === 'high' && task.status !== 'closed' && 'border-red-200 dark:border-red-800',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn('text-sm font-semibold text-foreground', task.status === 'closed' && 'line-through')}>
                          {task.title}
                        </h4>
                        {dday && (
                          <span className={cn(
                            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold',
                            dday.overdue ? 'bg-red-100 text-red-600 dark:bg-red-900/40' :
                            dday.days === 0 ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-50 text-blue-600 dark:bg-blue-900/30',
                          )}>{dday.label}</span>
                        )}
                      </div>
                      {task.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        {task.category && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: catColor ? `${catColor}20` : undefined, color: catColor }}>
                            {catColor && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catColor }} />}
                            {task.category}
                          </span>
                        )}
                        {task.dueTime && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock size={10} /> {task.dueTime}
                          </span>
                        )}
                        {task.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary font-medium">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unscheduled */}
      {unscheduled.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">미배정 업무 (이번 주 생성)</h2>
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
            {unscheduled.map((task) => (
              <TaskCard key={task.id} task={task} compact
                onEdit={(t) => { setEditingTask(t); setFormOpen(true); }}
                onDelete={(id) => setDeleteId(id)}
                onClick={(t) => setSelectedTask(t)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Task detail panel */}
      {selectedTask && (() => {
        const current = tasks.find((t) => t.id === selectedTask.id);
        return current ? (
          <TaskDetailPanel
            task={current}
            onClose={() => setSelectedTask(null)}
            onEdit={(t) => { setEditingTask(t); setFormOpen(true); setSelectedTask(null); }}
            onDelete={(id) => { setDeleteId(id); setSelectedTask(null); }}
          />
        ) : null;
      })()}

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
