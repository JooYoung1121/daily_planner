import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTaskStore } from '@/stores/taskStore';
import { KanbanColumn } from './KanbanColumn';
import { KanbanSortableCard } from './KanbanSortableCard';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormDialog, type TaskFormData } from '@/components/tasks/TaskFormDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { Task, TaskStatus } from '@/types/task';
import { todayString } from '@/lib/date';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: '할 일' },
  { id: 'in-progress', label: '진행 중' },
  { id: 'done', label: '완료' },
];

export function KanbanPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const reorderTasks = useTaskStore((s) => s.reorderTasks);
  const getTasksByStatus = useTaskStore((s) => s.getTasksByStatus);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId) ?? null,
    [tasks, activeId],
  );

  const columnTasks = useMemo(
    () =>
      Object.fromEntries(
        COLUMNS.map((col) => [col.id, getTasksByStatus(col.id)]),
      ) as Record<TaskStatus, Task[]>,
    [tasks, getTasksByStatus],
  );

  function findColumn(id: string): TaskStatus | undefined {
    // Check if id is a column id
    if (COLUMNS.some((c) => c.id === id)) return id as TaskStatus;
    // Find which column contains this task
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

    // Move task to new column
    updateTask(active.id as string, { status: overCol });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeCol = findColumn(active.id as string);
    const overCol = findColumn(over.id as string);

    if (!activeCol || !overCol) return;

    if (activeCol !== overCol) {
      await updateTask(active.id as string, { status: overCol });
    }

    // Reorder within the column
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

  const handleAddTask = (status: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setFormOpen(true);
  };

  const handleSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await addTask({ ...data, status: defaultStatus });
    }
    setEditingTask(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">칸반 보드</h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              count={columnTasks[col.id].length}
              onAdd={() => handleAddTask(col.id)}
            >
              <SortableContext
                items={columnTasks[col.id].map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnTasks[col.id].map((task) => (
                  <KanbanSortableCard
                    key={task.id}
                    task={task}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setFormOpen(true);
                    }}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} compact className="rotate-2 shadow-lg" />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmit}
        task={editingTask}
        defaultDate={todayString()}
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
        description="이 업무를 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="destructive"
      />
    </div>
  );
}
