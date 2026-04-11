import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  X,
  Edit2,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { TaskFormDialog, type TaskFormData } from '@/components/tasks/TaskFormDialog';
import { TaskFilterBar } from '@/components/tasks/TaskFilterBar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { todayString, formatDate, formatRelative } from '@/lib/date';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';
import type { Task, TaskStatus } from '@/types/task';

const COLUMNS: { id: TaskStatus; label: string; icon: typeof ListTodo }[] = [
  { id: 'todo', label: '할 일', icon: ListTodo },
  { id: 'in-progress', label: '진행 중', icon: Clock },
  { id: 'done', label: '완료', icon: CheckCircle2 },
];

export function DashboardPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);
  const getTasksByStatus = useTaskStore((s) => s.getTasksByStatus);
  const categories = useSettingsStore((s) => s.categories);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');
  const [activeId, setActiveId] = useState<string | null>(null);

  const today = todayString();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const overdue = tasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== 'done',
    );
    return { total, done, inProgress, overdueCount: overdue.length };
  }, [tasks, today]);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId) ?? null,
    [tasks, activeId],
  );

  const columnTasks = useMemo(
    () =>
      Object.fromEntries(
        COLUMNS.map((col) => [col.id, getTasksByStatus(col.id)]),
      ) as Record<TaskStatus, Task[]>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, getTasksByStatus],
  );

  // Keep selectedTask in sync
  const currentSelectedTask = useMemo(
    () => (selectedTask ? tasks.find((t) => t.id === selectedTask.id) ?? null : null),
    [tasks, selectedTask],
  );

  function findColumn(id: string): TaskStatus | undefined {
    if (COLUMNS.some((c) => c.id === id)) return id as TaskStatus;
    const task = tasks.find((t) => t.id === id);
    return task?.status;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeCol = findColumn(active.id as string);
    const overCol = findColumn(over.id as string);
    if (!activeCol || !overCol || activeCol === overCol) return;
    updateTask(active.id as string, { status: overCol });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const overCol = findColumn(over.id as string);
    if (!overCol) return;

    const colTasks = getTasksByStatus(overCol);
    const oldIndex = colTasks.findIndex((t) => t.id === active.id);
    const newIndex = colTasks.findIndex((t) => t.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const newOrder = [...colTasks];
      const [moved] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, moved);
      await reorderTasks(overCol, newOrder.map((t) => t.id));
    }
  }

  const handleSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await addTask({ ...data, status: defaultStatus });
    }
    setEditingTask(null);
  };

  const handleOpenAdd = (status: TaskStatus = 'todo') => {
    setEditingTask(null);
    setDefaultStatus(status);
    setFormOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
    setSelectedTask(null);
  };

  const getCategoryColor = (catName: string) => {
    return categories.find((c) => c.name === catName)?.color;
  };

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
          onClick={() => handleOpenAdd('todo')}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={16} />
          새 업무
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={ListTodo} label="전체 업무" value={stats.total} color="text-foreground" />
        <StatCard icon={Clock} label="진행 중" value={stats.inProgress} color="text-blue-500" />
        <StatCard icon={CheckCircle2} label="완료" value={stats.done} color="text-green-500" />
        <StatCard icon={AlertCircle} label="지연" value={stats.overdueCount} color="text-red-500" />
      </div>

      {/* Filter */}
      <TaskFilterBar />

      {/* Mini Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <MiniKanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={columnTasks[col.id]}
              onAdd={() => handleOpenAdd(col.id)}
              onSelect={setSelectedTask}
              getCategoryColor={getCategoryColor}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <MiniTaskCardOverlay task={activeTask} getCategoryColor={getCategoryColor} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Side Panel */}
      {currentSelectedTask && (
        <TaskDetailPanel
          task={currentSelectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={handleEdit}
          onDelete={(id) => {
            setDeleteId(id);
            setSelectedTask(null);
          }}
          onStatusChange={async (status) => {
            await updateTask(currentSelectedTask.id, { status });
          }}
          getCategoryColor={getCategoryColor}
        />
      )}

      <TaskFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmit}
        task={editingTask}
        defaultDate={today}
        defaultStatus={defaultStatus}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) await deleteTask(deleteId);
          setDeleteId(null);
        }}
        title="업무 삭제"
        description="이 업무를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        variant="destructive"
      />
    </div>
  );
}

/* === Sub-components === */

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: typeof ListTodo; label: string; value: number; color: string;
}) {
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

function MiniKanbanColumn({
  id, label, tasks, onAdd, onSelect, getCategoryColor,
}: {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  onAdd: () => void;
  onSelect: (task: Task) => void;
  getCategoryColor: (name: string) => string | undefined;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-lg border border-border bg-muted/30 transition-colors',
        isOver && 'border-primary/50 bg-primary/5',
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[id])}>
            {label}
          </span>
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        </div>
        <button onClick={onAdd} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          <Plus size={16} />
        </button>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-1 p-2 min-h-[120px] max-h-[400px] overflow-y-auto">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableMiniCard
              key={task.id}
              task={task}
              onSelect={onSelect}
              getCategoryColor={getCategoryColor}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">비어있음</p>
        )}
      </div>
    </div>
  );
}

function SortableMiniCard({
  task, onSelect, getCategoryColor,
}: {
  task: Task;
  onSelect: (task: Task) => void;
  getCategoryColor: (name: string) => string | undefined;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const catColor = task.category ? getCategoryColor(task.category) : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-start gap-2 rounded-md border border-border bg-card p-2.5 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-primary/30',
        task.status === 'done' && 'opacity-60',
      )}
      onClick={() => onSelect(task)}
    >
      {/* Drag handle */}
      <div {...attributes} {...listeners} className="mt-0.5 cursor-grab text-muted-foreground/40 hover:text-muted-foreground" onClick={(e) => e.stopPropagation()}>
        <GripVertical size={14} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className={cn('text-sm font-medium text-card-foreground leading-tight', task.status === 'done' && 'line-through')}>
            {task.title}
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          {task.category && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: catColor ? `${catColor}20` : undefined,
                color: catColor ?? undefined,
              }}
            >
              {catColor && <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catColor }} />}
              {task.category}
            </span>
          )}
          {task.dueDate && (
            <span className={cn(
              'text-[10px]',
              task.dueDate < todayString() && task.status !== 'done' ? 'text-red-500 font-medium' : 'text-muted-foreground',
            )}>
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniTaskCardOverlay({ task, getCategoryColor }: { task: Task; getCategoryColor: (name: string) => string | undefined }) {
  const catColor = task.category ? getCategoryColor(task.category) : undefined;
  return (
    <div className="rounded-md border border-primary bg-card p-2.5 shadow-lg rotate-2">
      <p className="text-sm font-medium">{task.title}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {task.category && (
          <span className="text-[10px]" style={{ color: catColor }}>{task.category}</span>
        )}
      </div>
    </div>
  );
}

function TaskDetailPanel({
  task, onClose, onEdit, onDelete, onStatusChange, getCategoryColor,
}: {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (status: TaskStatus) => void;
  getCategoryColor: (name: string) => string | undefined;
}) {
  const catColor = task.category ? getCategoryColor(task.category) : undefined;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto h-full w-[420px] max-w-full border-l border-border bg-card shadow-xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3">
          <h3 className="text-base font-semibold text-card-foreground">업무 상세</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <h2 className={cn('text-lg font-bold text-foreground', task.status === 'done' && 'line-through')}>
              {task.title}
            </h2>
            {task.description && (
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            )}
          </div>

          {/* Status change buttons */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">상태 변경</label>
            <div className="flex gap-2">
              {(['todo', 'in-progress', 'done'] as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={cn(
                    'flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors border',
                    task.status === s
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-foreground hover:bg-accent',
                  )}
                >
                  {s === 'todo' ? '할 일' : s === 'in-progress' ? '진행 중' : '완료'}
                </button>
              ))}
            </div>
          </div>

          {/* Meta info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">우선순위</span>
              <PriorityBadge priority={task.priority} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">상태</span>
              <StatusBadge status={task.status} />
            </div>
            {task.category && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">카테고리</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: catColor }}>
                  {catColor && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: catColor }} />}
                  {task.category}
                </span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">마감일</span>
                <span className="text-sm text-foreground">
                  {formatDate(task.dueDate)}
                  {task.dueTime && ` ${task.dueTime}`}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">생성</span>
              <span className="text-xs text-muted-foreground">{formatRelative(task.createdAt)}</span>
            </div>
            {task.completedAt && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">완료</span>
                <span className="text-xs text-muted-foreground">{formatRelative(task.completedAt)}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">태그</label>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-xs text-primary font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              onClick={() => onEdit(task)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              <Edit2 size={14} />
              수정
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-red-700"
            >
              <Trash2 size={14} />
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
