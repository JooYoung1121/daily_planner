import { cn } from '@/lib/utils';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants';
import type { TaskPriority } from '@/types/task';

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        PRIORITY_COLORS[priority],
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
