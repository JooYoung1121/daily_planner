import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getDay, parseISO } from 'date-fns';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { TaskFormDialog, type TaskFormData } from '@/components/tasks/TaskFormDialog';
import { TaskFilterBar } from '@/components/tasks/TaskFilterBar';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { todayString, formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

export function DashboardPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const getFilteredTasks = useTaskStore((s) => s.getFilteredTasks);

  // Schedule (today's checklist)
  const scheduleItems = useTaskStore((s) => s.scheduleItems);
  const loadSchedule = useTaskStore((s) => s.loadSchedule);
  const addScheduleItem = useTaskStore((s) => s.addScheduleItem);
  const toggleScheduleItem = useTaskStore((s) => s.toggleScheduleItem);
  const deleteScheduleItem = useTaskStore((s) => s.deleteScheduleItem);

  const routines = useSettingsStore((s) => s.routines);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');

  const today = todayString();

  // Load schedule & auto-populate routines for today
  useEffect(() => {
    (async () => {
      await loadSchedule(today);
      // Check if routines already applied today
      const currentItems = useTaskStore.getState().scheduleItems;
      const todayDow = getDay(parseISO(today)); // 0=Sun
      const activeRoutines = routines.filter(
        (r) => r.enabled && (r.days.length === 0 || r.days.includes(todayDow)),
      );
      // Only add routines not yet present (match by time+title)
      for (const routine of activeRoutines) {
        const exists = currentItems.some(
          (i) => i.time === routine.time && i.title === routine.title,
        );
        if (!exists) {
          await addScheduleItem({
            time: routine.time,
            title: routine.title,
            done: false,
            taskId: null,
            date: today,
          });
        }
      }
    })();
  }, [today, loadSchedule, routines, addScheduleItem]);

  const stats = useMemo(() => {
    const topLevel = tasks.filter((t) => !t.parentId);
    const total = topLevel.length;
    const closed = topLevel.filter((t) => t.status === 'closed').length;
    const inProgress = topLevel.filter((t) => t.status === 'in-progress').length;
    const overdue = topLevel.filter((t) => t.dueDate && t.dueDate < today && t.status !== 'closed');
    return { total, closed, inProgress, overdueCount: overdue.length };
  }, [tasks, today]);

  const filteredTasks = getFilteredTasks();

  const currentSelected = useMemo(
    () => (selectedTask ? tasks.find((t) => t.id === selectedTask.id) ?? null : null),
    [tasks, selectedTask],
  );

  const handleSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await addTask({
        ...data,
        parentId: data.parentId ?? null,
        subtasks: [],
        recurrence: data.recurrence ?? null,
        recurrenceSourceId: null,
      });
    }
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
    setSelectedTask(null);
  };

  const handleAddSchedule = () => {
    if (!scheduleTitle.trim()) return;
    addScheduleItem({ time: scheduleTime, title: scheduleTitle.trim(), done: false, taskId: null, date: today });
    setScheduleTitle('');
  };

  const completedSchedule = scheduleItems.filter((i) => i.done).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(today)} - 오늘의 업무 현황
          </p>
        </div>
        <button
          onClick={() => { setEditingTask(null); setFormOpen(true); }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={16} />
          새 업무
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={ListTodo} label="전체 업무" value={stats.total} color="text-foreground" />
        <StatCard icon={Clock} label="In Progress" value={stats.inProgress} color="text-blue-500" />
        <StatCard icon={CheckCircle2} label="Closed" value={stats.closed} color="text-green-500" />
        <StatCard icon={AlertCircle} label="지연" value={stats.overdueCount} color="text-red-500" />
      </div>

      {/* Today's Checklist */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckSquare size={16} className="text-primary" />
            오늘의 할일
            {scheduleItems.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                {completedSchedule}/{scheduleItems.length}
              </span>
            )}
          </h2>
        </div>

        {/* Add schedule item */}
        <div className="flex gap-2 px-4 py-2 border-b border-border">
          <input
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="w-24 rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="text"
            value={scheduleTitle}
            onChange={(e) => setScheduleTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSchedule()}
            placeholder="할 일 추가..."
            className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleAddSchedule}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            추가
          </button>
        </div>

        {/* Schedule list */}
        {scheduleItems.length > 0 ? (
          <div className="divide-y divide-border">
            {scheduleItems.map((item) => (
              <div key={item.id} className={cn('group flex items-center gap-3 px-4 py-2.5', item.done && 'bg-muted/30')}>
                <button onClick={() => toggleScheduleItem(item.id)} className="shrink-0">
                  {item.done
                    ? <CheckSquare size={16} className="text-green-500" />
                    : <Square size={16} className="text-muted-foreground hover:text-primary" />}
                </button>
                <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">{item.time}</span>
                <span className={cn('flex-1 text-sm', item.done && 'line-through text-muted-foreground')}>{item.title}</span>
                <button
                  onClick={() => deleteScheduleItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-4 text-center text-xs text-muted-foreground">오늘의 할일을 추가하세요</p>
        )}
      </div>

      {/* Filter + Task Grid */}
      <div className="space-y-4">
        <TaskFilterBar />
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="업무가 없습니다"
            description="새 업무를 추가하여 시작하세요"
            action={
              <button
                onClick={() => { setEditingTask(null); setFormOpen(true); }}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus size={16} />
                업무 추가
              </button>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteId(id)}
                  onClick={(t) => setSelectedTask(t)}
                />
              ))}
          </div>
        )}
      </div>

      {/* Task Detail Side Panel */}
      {currentSelected && (
        <TaskDetailPanel
          task={currentSelected}
          onClose={() => setSelectedTask(null)}
          onEdit={handleEdit}
          onDelete={(id) => { setDeleteId(id); setSelectedTask(null); }}
        />
      )}

      <TaskFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingTask(null); }}
        onSubmit={handleSubmit}
        task={editingTask}
        defaultDate={today}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) await deleteTask(deleteId); setDeleteId(null); }}
        title="업무 삭제"
        description="이 업무를 삭제하시겠습니까? 하위 업무도 함께 삭제됩니다."
        confirmLabel="삭제"
        variant="destructive"
      />
    </div>
  );
}

/* --- Sub-components --- */

function StatCard({ icon: Icon, label, value, color }: { icon: typeof ListTodo; label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon size={20} className={color} />
        <div>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
