import { useState, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Repeat,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { TaskFormDialog, type TaskFormData } from '@/components/tasks/TaskFormDialog';
import { TaskFilterBar } from '@/components/tasks/TaskFilterBar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { todayString, formatDate, formatRelative } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types/task';

const SECTIONS: { id: TaskStatus; label: string; icon: typeof ListTodo; emptyText: string }[] = [
  { id: 'open', label: 'Open', icon: ListTodo, emptyText: '새 업무를 추가하세요' },
  { id: 'in-progress', label: 'In Progress', icon: Clock, emptyText: '진행 중인 업무가 없습니다' },
  { id: 'closed', label: 'Closed', icon: CheckCircle2, emptyText: '완료된 업무가 없습니다' },
];

export function DashboardPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const completeAndRecur = useTaskStore((s) => s.completeAndRecur);
  const addSubtask = useTaskStore((s) => s.addSubtask);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);
  const deleteSubtask = useTaskStore((s) => s.deleteSubtask);
  const getTasksByStatus = useTaskStore((s) => s.getTasksByStatus);
  const getChildTasks = useTaskStore((s) => s.getChildTasks);
  const categories = useSettingsStore((s) => s.categories);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('open');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [subtaskInput, setSubtaskInput] = useState('');

  const today = todayString();

  const stats = useMemo(() => {
    const topLevel = tasks.filter((t) => !t.parentId);
    const total = topLevel.length;
    const closed = topLevel.filter((t) => t.status === 'closed').length;
    const inProgress = topLevel.filter((t) => t.status === 'in-progress').length;
    const overdue = topLevel.filter((t) => t.dueDate && t.dueDate < today && t.status !== 'closed');
    return { total, closed, inProgress, overdueCount: overdue.length };
  }, [tasks, today]);

  // Keep selectedTask in sync
  const currentSelected = useMemo(
    () => (selectedTask ? tasks.find((t) => t.id === selectedTask.id) ?? null : null),
    [tasks, selectedTask],
  );

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await addTask({
        ...data,
        status: defaultStatus,
        parentId: data.parentId ?? null,
        subtasks: [],
        recurrence: data.recurrence ?? null,
        recurrenceSourceId: null,
      });
    }
    setEditingTask(null);
  };

  const handleOpenAdd = (status: TaskStatus = 'open') => {
    setEditingTask(null);
    setDefaultStatus(status);
    setFormOpen(true);
  };

  const getCategoryColor = (catName: string) =>
    categories.find((c) => c.name === catName)?.color;

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (newStatus === 'closed' && task.recurrence) {
      await completeAndRecur(task.id);
    } else {
      await updateTask(task.id, { status: newStatus });
    }
    if (selectedTask?.id === task.id) {
      setSelectedTask(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
          <p className="text-sm text-muted-foreground">{formatDate(today)}</p>
        </div>
        <button
          onClick={() => handleOpenAdd('open')}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={16} />
          새 업무
        </button>
      </div>

      {/* Stats - Notion style cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="전체" value={stats.total} icon={ListTodo} color="text-foreground" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock} color="text-blue-500" />
        <StatCard label="Closed" value={stats.closed} icon={CheckCircle2} color="text-green-500" />
        <StatCard label="지연" value={stats.overdueCount} icon={AlertCircle} color="text-red-500" />
      </div>

      {/* Filter */}
      <TaskFilterBar />

      {/* Collapsible sections - Asana style */}
      <div className="space-y-2">
        {SECTIONS.map((section) => {
          const sectionTasks = getTasksByStatus(section.id);
          const isCollapsed = collapsedSections.has(section.id);

          return (
            <div key={section.id} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
              >
                {isCollapsed ? <ChevronRight size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                <section.icon size={16} className={section.id === 'open' ? 'text-slate-500' : section.id === 'in-progress' ? 'text-blue-500' : 'text-green-500'} />
                <span className="text-sm font-semibold text-foreground">{section.label}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{sectionTasks.length}</span>
                <div className="flex-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenAdd(section.id); }}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Plus size={14} />
                </button>
              </button>

              {/* Section content */}
              {!isCollapsed && (
                <div className="border-t border-border">
                  {sectionTasks.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">{section.emptyText}</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {sectionTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          childTasks={getChildTasks(task.id)}
                          onSelect={setSelectedTask}
                          onStatusChange={handleStatusChange}
                          getCategoryColor={getCategoryColor}
                          today={today}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Task Detail Side Panel */}
      {currentSelected && (
        <TaskDetailPanel
          task={currentSelected}
          childTasks={getChildTasks(currentSelected.id)}
          onClose={() => setSelectedTask(null)}
          onEdit={(t) => { setEditingTask(t); setFormOpen(true); setSelectedTask(null); }}
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
        defaultStatus={defaultStatus}
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

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof ListTodo; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <Icon size={18} className={color} />
        <div>
          <p className="text-xl font-bold text-card-foreground">{value}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  task, childTasks, onSelect, onStatusChange, getCategoryColor, today,
}: {
  task: Task;
  childTasks: Task[];
  onSelect: (t: Task) => void;
  onStatusChange: (t: Task, s: TaskStatus) => void;
  getCategoryColor: (name: string) => string | undefined;
  today: string;
}) {
  const catColor = task.category ? getCategoryColor(task.category) : undefined;
  const subtasksDone = task.subtasks.filter((s) => s.done).length;
  const subtasksTotal = task.subtasks.length;
  const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'closed';

  return (
    <div
      onClick={() => onSelect(task)}
      className={cn(
        'group flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-accent/30',
        task.status === 'closed' && 'opacity-50',
      )}
    >
      {/* Status checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (task.status === 'closed') onStatusChange(task, 'open');
          else if (task.status === 'open') onStatusChange(task, 'in-progress');
          else onStatusChange(task, 'closed');
        }}
        className={cn(
          'shrink-0 rounded-full border-2 w-5 h-5 flex items-center justify-center transition-colors',
          task.status === 'closed' ? 'border-green-500 bg-green-500 text-white' :
          task.status === 'in-progress' ? 'border-blue-500 bg-blue-500/20' :
          'border-muted-foreground/40 hover:border-primary',
        )}
      >
        {task.status === 'closed' && <CheckCircle2 size={12} />}
        {task.status === 'in-progress' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
      </button>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium text-foreground truncate', task.status === 'closed' && 'line-through text-muted-foreground')}>
            {task.title}
          </span>
          {task.recurrence && <Repeat size={12} className="text-muted-foreground shrink-0" />}
          {childTasks.length > 0 && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              +{childTasks.length} 하위
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          {task.category && (
            <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: catColor ? `${catColor}15` : undefined, color: catColor }}>
              {catColor && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catColor }} />}
              {task.category}
            </span>
          )}
          {task.dueDate && (
            <span className={cn('text-[10px]', isOverdue ? 'text-red-500 font-semibold' : 'text-muted-foreground')}>
              {formatDate(task.dueDate)}{task.dueTime && ` ${task.dueTime}`}
            </span>
          )}
          {subtasksTotal > 0 && (
            <span className="text-[10px] text-muted-foreground">
              <CheckSquare size={10} className="inline mr-0.5" />
              {subtasksDone}/{subtasksTotal}
            </span>
          )}
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary font-medium">#{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskDetailPanel({
  task, childTasks, onClose, onEdit, onDelete, onStatusChange, getCategoryColor,
  subtaskInput, setSubtaskInput, onAddSubtask, onToggleSubtask, onDeleteSubtask,
}: {
  task: Task;
  childTasks: Task[];
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
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3">
          <h3 className="text-sm font-semibold text-muted-foreground">업무 상세</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
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
            {task.category && (
              <MetaRow label="카테고리">
                <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: catColor }}>
                  {catColor && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: catColor }} />}
                  {task.category}
                </span>
              </MetaRow>
            )}
            {task.dueDate && (
              <MetaRow label="마감일">
                {formatDate(task.dueDate)}{task.dueTime && ` ${task.dueTime}`}
              </MetaRow>
            )}
            {task.recurrence && (
              <MetaRow label="반복">
                <span className="inline-flex items-center gap-1">
                  <Repeat size={12} />
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

          {/* Subtasks (checklist) */}
          <div>
            <label className="mb-2 block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              서브태스크 {task.subtasks.length > 0 && `(${subtasksDone}/${task.subtasks.length})`}
            </label>
            {task.subtasks.length > 0 && (
              <div className="mb-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${task.subtasks.length ? (subtasksDone / task.subtasks.length) * 100 : 0}%` }}
                />
              </div>
            )}
            <div className="space-y-1">
              {task.subtasks.map((st) => (
                <div key={st.id} className="group flex items-center gap-2">
                  <button onClick={() => onToggleSubtask(task.id, st.id)} className="shrink-0">
                    {st.done
                      ? <CheckSquare size={16} className="text-green-500" />
                      : <Square size={16} className="text-muted-foreground" />}
                  </button>
                  <span className={cn('flex-1 text-sm', st.done && 'line-through text-muted-foreground')}>{st.title}</span>
                  <button
                    onClick={() => onDeleteSubtask(task.id, st.id)}
                    className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddSubtask(task.id); }}}
                placeholder="서브태스크 추가..."
                className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={() => onAddSubtask(task.id)}
                className="rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:opacity-80"
              >
                추가
              </button>
            </div>
          </div>

          {/* Child tasks */}
          {childTasks.length > 0 && (
            <div>
              <label className="mb-2 block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">하위 업무</label>
              <div className="space-y-1">
                {childTasks.map((ct) => (
                  <div key={ct.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                    <span className={cn('flex-1', ct.status === 'closed' && 'line-through text-muted-foreground')}>{ct.title}</span>
                    <PriorityBadge priority={ct.priority} />
                  </div>
                ))}
              </div>
            </div>
          )}

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
