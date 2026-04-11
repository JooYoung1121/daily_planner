import { Clock, Trash2, Edit2, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { useSettingsStore } from '@/stores/settingsStore';
import { formatDate, getDday } from '@/lib/date';
import type { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onClick?: (task: Task) => void;
  compact?: boolean;
  className?: string;
}

export function TaskCard({ task, onEdit, onDelete, onClick, compact, className }: TaskCardProps) {
  const categories = useSettingsStore((s) => s.categories);
  const catColor = task.category
    ? categories.find((c) => c.name === task.category)?.color
    : undefined;

  const dday = task.dueDate && task.status !== 'closed' ? getDday(task.dueDate) : null;
  const subtasksDone = task.subtasks?.filter((s) => s.done).length ?? 0;
  const subtasksTotal = task.subtasks?.length ?? 0;

  return (
    <div
      onClick={() => onClick?.(task)}
      className={cn(
        'group rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md',
        task.status === 'closed' && 'opacity-60',
        onClick && 'cursor-pointer hover:border-primary/30',
        dday?.overdue && 'border-red-300 dark:border-red-800',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className={cn('text-sm font-medium text-card-foreground', task.status === 'closed' && 'line-through')}>
          {task.title}
        </h4>
        <div className="flex items-center gap-1">
          {/* D-day badge */}
          {dday && (
            <span className={cn(
              'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold',
              dday.overdue ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' :
              dday.days === 0 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' :
              dday.days <= 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
              'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            )}>
              {dday.label}
            </span>
          )}
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit && (
              <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                <Edit2 size={14} />
              </button>
            )}
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {!compact && task.description && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className={cn('inline-flex items-center gap-1 text-xs', dday?.overdue ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
            <Clock size={12} />
            {formatDate(task.dueDate)}
            {task.dueTime && ` ${task.dueTime}`}
          </span>
        )}
        {task.category && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: catColor ? `${catColor}20` : undefined, color: catColor ?? undefined }}>
            {catColor && <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: catColor }} />}
            {task.category}
          </span>
        )}
        {subtasksTotal > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <CheckSquare size={10} />
            {subtasksDone}/{subtasksTotal}
          </span>
        )}
      </div>

      {!compact && task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] text-primary font-medium">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
