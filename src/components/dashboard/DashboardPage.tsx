import { useState, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
} from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormDialog, type TaskFormData } from '@/components/tasks/TaskFormDialog';
import { TaskFilterBar } from '@/components/tasks/TaskFilterBar';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { todayString, formatDate } from '@/lib/date';
import type { Task } from '@/types/task';

export function DashboardPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const getFilteredTasks = useTaskStore((s) => s.getFilteredTasks);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const today = todayString();

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const todayTasks = tasks.filter((t) => t.dueDate === today);
    const overdue = tasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== 'done',
    );
    return { total, done, inProgress, todayCount: todayTasks.length, overdueCount: overdue.length };
  }, [tasks, today]);

  const filteredTasks = getFilteredTasks();

  const handleSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await addTask(data);
    }
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTask(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(today)} - 오늘의 업무 현황
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={16} />
          새 업무
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={ListTodo} label="전체 업무" value={stats.total} color="text-foreground" />
        <StatCard icon={Clock} label="진행 중" value={stats.inProgress} color="text-blue-500" />
        <StatCard icon={CheckCircle2} label="완료" value={stats.done} color="text-green-500" />
        <StatCard icon={AlertCircle} label="지연" value={stats.overdueCount} color="text-red-500" />
      </div>

      {/* Filter + Task List */}
      <div className="space-y-4">
        <TaskFilterBar />
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="업무가 없습니다"
            description="새 업무를 추가하여 시작하세요"
            action={
              <button
                onClick={() => {
                  setEditingTask(null);
                  setFormOpen(true);
                }}
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
                />
              ))}
          </div>
        )}
      </div>

      <TaskFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmit}
        task={editingTask}
        defaultDate={today}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="업무 삭제"
        description="이 업무를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        variant="destructive"
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof ListTodo;
  label: string;
  value: number;
  color: string;
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
