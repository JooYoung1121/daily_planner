import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  Edit2,
  Trash2,
  X,
  Repeat,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormDialog, type TaskFormData } from '@/components/tasks/TaskFormDialog';
import { TaskFilterBar } from '@/components/tasks/TaskFilterBar';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { todayString, formatDate, formatRelative } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types/task';

export function DashboardPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const completeAndRecur = useTaskStore((s) => s.completeAndRecur);
  const getFilteredTasks = useTaskStore((s) => s.getFilteredTasks);
  const addSubtask = useTaskStore((s) => s.addSubtask);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);
  const deleteSubtask = useTaskStore((s) => s.deleteSubtask);

  // Schedule (today's checklist)
  const scheduleItems = useTaskStore((s) => s.scheduleItems);
  const loadSchedule = useTaskStore((s) => s.loadSchedule);
  const addScheduleItem = useTaskStore((s) => s.addScheduleItem);
  const toggleScheduleItem = useTaskStore((s) => s.toggleScheduleItem);
  const deleteScheduleItem = useTaskStore((s) => s.deleteScheduleItem);

  const categories = useSettingsStore((s) => s.categories);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');

  const today = todayString();

  useEffect(() => {
    loadSchedule(today);
  }, [today, loadSchedule]);

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

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (newStatus === 'closed' && task.recurrence) {
      await completeAndRecur(task.id);
    } else {
      await updateTask(task.id, { status: newStatus });
    }
  };

  const getCategoryColor = (catName: string) =>
    categories.find((c) => c.name === catName)?.color;

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
          onStatusChange={handleStatusChange}
          getCategoryColor={getCategoryColor}
          subtaskInput={subtaskInput}
          setSubtaskInput={setSubtaskInput}
          onAddSubtask={async (taskId) => {
            if (subtaskInput.trim()) {
              await addSubtask(taskId, subtaskInput.trim());
              setSubtaskInput('');
            }
          }}
          onToggleSubtask={toggleSubtask}
          onDeleteSubtask={deleteSubtask}
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

function TaskDetailPanel({
  task, onClose, onEdit, onDelete, onStatusChange, getCategoryColor,
  subtaskInput, setSubtaskInput, onAddSubtask, onToggleSubtask, onDeleteSubtask,
}: {
  task: Task;
  onClose: () => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (t: Task, s: TaskStatus) => void;
  getCategoryColor: (name: string) => string | undefined;
  subtaskInput: string;
  setSubtaskInput: (v: string) => void;
  onAddSubtask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}) {
  const catColor = task.category ? getCategoryColor(task.category) : undefined;
  const subtasksDone = task.subtasks.filter((s) => s.done).length;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto h-full w-[440px] max-w-full border-l border-border bg-card shadow-xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3">
          <h3 className="text-sm font-semibold text-muted-foreground">업무 상세</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          <h2 className={cn('text-lg font-bold text-foreground', task.status === 'closed' && 'line-through')}>
            {task.title}
          </h2>
          {task.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
          )}

          {/* Status buttons */}
          <div>
            <label className="mb-2 block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">상태</label>
            <div className="flex gap-2">
              {(['open', 'in-progress', 'closed'] as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(task, s)}
                  className={cn(
                    'flex-1 rounded-md px-3 py-2 text-xs font-medium border transition-colors',
                    task.status === s
                      ? s === 'open' ? 'border-slate-400 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        : s === 'in-progress' ? 'border-blue-400 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'border-green-400 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                      : 'border-border text-muted-foreground hover:bg-accent',
                  )}
                >
                  {s === 'open' ? 'Open' : s === 'in-progress' ? 'In Progress' : 'Closed'}
                </button>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="space-y-2.5 text-sm">
            <MetaRow label="우선순위"><PriorityBadge priority={task.priority} /></MetaRow>
            <MetaRow label="상태"><StatusBadge status={task.status} /></MetaRow>
            {task.category && (
              <MetaRow label="카테고리">
                <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: catColor }}>
                  {catColor && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: catColor }} />}
                  {task.category}
                </span>
              </MetaRow>
            )}
            {task.dueDate && (
              <MetaRow label="마감일">{formatDate(task.dueDate)}{task.dueTime && ` ${task.dueTime}`}</MetaRow>
            )}
            {task.recurrence && (
              <MetaRow label="반복">
                <span className="inline-flex items-center gap-1"><Repeat size={12} />
                  {task.recurrence.interval > 1 && `${task.recurrence.interval}`}
                  {task.recurrence.type === 'daily' ? '매일' : task.recurrence.type === 'weekly' ? '매주' : '매월'}
                </span>
              </MetaRow>
            )}
            <MetaRow label="생성">{formatRelative(task.createdAt)}</MetaRow>
            {task.completedAt && <MetaRow label="완료">{formatRelative(task.completedAt)}</MetaRow>}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div>
              <label className="mb-2 block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">태그</label>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary font-medium">#{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks */}
          <div>
            <label className="mb-2 block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              서브태스크 {task.subtasks.length > 0 && `(${subtasksDone}/${task.subtasks.length})`}
            </label>
            {task.subtasks.length > 0 && (
              <div className="mb-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(subtasksDone / task.subtasks.length) * 100}%` }} />
              </div>
            )}
            <div className="space-y-1">
              {task.subtasks.map((st) => (
                <div key={st.id} className="group flex items-center gap-2">
                  <button onClick={() => onToggleSubtask(task.id, st.id)} className="shrink-0">
                    {st.done ? <CheckSquare size={16} className="text-green-500" /> : <Square size={16} className="text-muted-foreground" />}
                  </button>
                  <span className={cn('flex-1 text-sm', st.done && 'line-through text-muted-foreground')}>{st.title}</span>
                  <button onClick={() => onDeleteSubtask(task.id, st.id)} className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-red-500"><X size={12} /></button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddSubtask(task.id); } }}
                placeholder="서브태스크 추가..."
                className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button onClick={() => onAddSubtask(task.id)} className="rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:opacity-80">추가</button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <button onClick={() => onEdit(task)} className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm font-medium hover:bg-accent">
              <Edit2 size={14} /> 수정
            </button>
            <button onClick={() => onDelete(task.id)} className="flex flex-1 items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-red-700">
              <Trash2 size={14} /> 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  );
}
