import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';

interface KanbanColumnProps {
  id: string;
  label: string;
  count: number;
  onAdd: () => void;
  children: React.ReactNode;
}

export function KanbanColumn({ id, label, count, onAdd, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-lg border border-border bg-muted/30 p-3 transition-colors',
        isOver && 'border-primary/50 bg-primary/5',
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              STATUS_COLORS[id],
            )}
          >
            {label}
          </span>
          <span className="text-xs text-muted-foreground">{count}</span>
        </div>
        <button
          onClick={onAdd}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex min-h-[200px] flex-col gap-2">
        {children}
      </div>
    </div>
  );
}
