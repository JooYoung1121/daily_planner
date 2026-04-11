import { useState } from 'react';
import { X, Edit2, Trash2, Repeat, CheckSquare, Square } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, formatRelative, getDday } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types/task';

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskDetailPanel({ task, onClose, onEdit, onDelete }: TaskDetailPanelProps) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const completeAndRecur = useTaskStore((s) => s.completeAndRecur);
  const addSubtask = useTaskStore((s) => s.addSubtask);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);
  const deleteSubtask = useTaskStore((s) => s.deleteSubtask);
  const categories = useSettingsStore((s) => s.categories);

  const [subtaskInput, setSubtaskInput] = useState('');

  const catColor = task.category ? categories.find((c) => c.name === task.category)?.color : undefined;
  const subtasksDone = task.subtasks.filter((s) => s.done).length;
  const dday = task.dueDate && task.status !== 'closed' ? getDday(task.dueDate) : null;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === 'closed' && task.recurrence) {
      await completeAndRecur(task.id);
    } else {
      await updateTask(task.id, { status: newStatus });
    }
  };

  const handleAddSubtask = async () => {
    if (subtaskInput.trim()) {
      await addSubtask(task.id, subtaskInput.trim());
      setSubtaskInput('');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto h-full w-[440px] max-w-full border-l border-border bg-card shadow-xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3">
          <h3 className="text-sm font-semibold text-muted-foreground">업무 상세</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className={cn('text-lg font-bold text-foreground', task.status === 'closed' && 'line-through')}>
              {task.title}
            </h2>
            {dday && (
              <span className={cn(
                'shrink-0 rounded px-2 py-1 text-xs font-bold',
                dday.overdue ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' :
                dday.days === 0 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40' :
                dday.days <= 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40' :
                'bg-blue-50 text-blue-600 dark:bg-blue-900/30',
              )}>{dday.label}</span>
            )}
          </div>
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
                  onClick={() => handleStatusChange(s)}
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
                  {task.recurrence.type === 'daily' ? '매일' :
                   task.recurrence.type === 'weekdays' ? `매주 ${(task.recurrence as { dayOfWeek?: number }).dayOfWeek !== undefined ? ['일', '월', '화', '수', '목', '금', '토'][(task.recurrence as { dayOfWeek?: number }).dayOfWeek ?? 0] + '요일' : ''}` :
                   task.recurrence.type === 'weekly' ? '매주' : '매월'}
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
                  <button onClick={() => toggleSubtask(task.id, st.id)} className="shrink-0">
                    {st.done ? <CheckSquare size={16} className="text-green-500" /> : <Square size={16} className="text-muted-foreground" />}
                  </button>
                  <span className={cn('flex-1 text-sm', st.done && 'line-through text-muted-foreground')}>{st.title}</span>
                  <button onClick={() => deleteSubtask(task.id, st.id)} className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-red-500"><X size={12} /></button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                placeholder="서브태스크 추가..."
                className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button onClick={handleAddSubtask} className="rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:opacity-80">추가</button>
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
