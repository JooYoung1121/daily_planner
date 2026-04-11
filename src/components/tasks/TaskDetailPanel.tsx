import { useState } from 'react';
import { X, Edit2, Trash2, Repeat, Plus, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
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
  onSelectTask?: (t: Task) => void;
}

export function TaskDetailPanel({ task, onClose, onEdit, onDelete, onSelectTask }: TaskDetailPanelProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const updateTask = useTaskStore((s) => s.updateTask);
  const addTask = useTaskStore((s) => s.addTask);
  const completeAndRecur = useTaskStore((s) => s.completeAndRecur);
  const getChildTasks = useTaskStore((s) => s.getChildTasks);
  const categories = useSettingsStore((s) => s.categories);

  const [showAddChild, setShowAddChild] = useState(false);
  const [childTitle, setChildTitle] = useState('');
  const [showLinkParent, setShowLinkParent] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');

  const catColor = task.category ? categories.find((c) => c.name === task.category)?.color : undefined;
  const dday = task.dueDate && task.status !== 'closed' ? getDday(task.dueDate) : null;

  // Parent/child relationships
  const parentTask = task.parentId ? tasks.find((t) => t.id === task.parentId) : null;
  const childTasks = getChildTasks(task.id);
  const childDone = childTasks.filter((t) => t.status === 'closed').length;

  // For linking: available tasks (not self, not already parent/child)
  const linkableTasks = tasks.filter((t) =>
    t.id !== task.id &&
    t.id !== task.parentId &&
    t.parentId !== task.id &&
    !t.parentId && // only top-level can be parent
    t.title.toLowerCase().includes(linkSearch.toLowerCase()),
  ).slice(0, 8);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === 'closed' && task.recurrence) {
      await completeAndRecur(task.id);
    } else {
      await updateTask(task.id, { status: newStatus });
    }
  };

  const handleAddChild = async () => {
    if (!childTitle.trim()) return;
    await addTask({
      title: childTitle.trim(),
      description: '',
      status: 'open',
      priority: task.priority,
      category: task.category,
      tags: [],
      dueDate: task.dueDate,
      dueTime: null,
      parentId: task.id,
      subtasks: [],
      recurrence: null,
      recurrenceSourceId: null,
    });
    setChildTitle('');
    setShowAddChild(false);
  };

  const handleLinkParent = async (parentId: string) => {
    await updateTask(task.id, { parentId });
    setShowLinkParent(false);
    setLinkSearch('');
  };

  const handleUnlinkParent = async () => {
    await updateTask(task.id, { parentId: null });
  };

  const navigateTo = (t: Task) => {
    if (onSelectTask) onSelectTask(t);
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
          {/* Parent link */}
          {parentTask && (
            <button
              onClick={() => navigateTo(parentTask)}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent w-full text-left"
            >
              <ArrowUp size={12} />
              <span className="truncate">상위: {parentTask.title}</span>
              <ExternalLink size={10} className="shrink-0 ml-auto" />
            </button>
          )}

          {/* Title + D-day */}
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
                   task.recurrence.type === 'weekdays' ? `매주 ${task.recurrence.dayOfWeek !== undefined ? ['일', '월', '화', '수', '목', '금', '토'][task.recurrence.dayOfWeek] + '요일' : ''}` :
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

          {/* Child issues (하위 이슈) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDown size={12} />
                하위 이슈
                {childTasks.length > 0 && ` (${childDone}/${childTasks.length})`}
              </label>
              <button
                onClick={() => setShowAddChild(!showAddChild)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Child progress */}
            {childTasks.length > 0 && (
              <div className="mb-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${(childDone / childTasks.length) * 100}%` }}
                />
              </div>
            )}

            {/* Child list */}
            <div className="space-y-1.5">
              {childTasks.map((child) => (
                <button
                  key={child.id}
                  onClick={() => navigateTo(child)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-accent/50',
                    child.status === 'closed' && 'opacity-50',
                  )}
                >
                  <span className={cn(
                    'shrink-0 w-2 h-2 rounded-full',
                    child.status === 'closed' ? 'bg-green-500' : child.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-400',
                  )} />
                  <span className={cn('flex-1 text-sm truncate', child.status === 'closed' && 'line-through text-muted-foreground')}>
                    {child.title}
                  </span>
                  <PriorityBadge priority={child.priority} />
                  <StatusBadge status={child.status} />
                </button>
              ))}
            </div>

            {/* Add child form */}
            {showAddChild && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={childTitle}
                  onChange={(e) => setChildTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChild(); } }}
                  placeholder="하위 이슈 제목..."
                  className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
                <button onClick={handleAddChild} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">추가</button>
              </div>
            )}

            {childTasks.length === 0 && !showAddChild && (
              <p className="text-xs text-muted-foreground/50 py-1">하위 이슈 없음</p>
            )}
          </div>

          {/* Link to parent (상위 이슈 연결) */}
          {!task.parentId && (
            <div>
              <label className="mb-2 block text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUp size={12} />
                상위 이슈 연결
              </label>
              {showLinkParent ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={linkSearch}
                    onChange={(e) => setLinkSearch(e.target.value)}
                    placeholder="이슈 검색..."
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                  />
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {linkableTasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleLinkParent(t.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left hover:bg-accent"
                      >
                        <span className="truncate flex-1">{t.title}</span>
                        <StatusBadge status={t.status} />
                      </button>
                    ))}
                    {linkableTasks.length === 0 && (
                      <p className="text-xs text-muted-foreground py-2 text-center">연결 가능한 이슈 없음</p>
                    )}
                  </div>
                  <button onClick={() => { setShowLinkParent(false); setLinkSearch(''); }} className="text-xs text-muted-foreground hover:text-foreground">취소</button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLinkParent(true)}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  + 상위 이슈 연결
                </button>
              )}
            </div>
          )}

          {/* Unlink parent */}
          {task.parentId && (
            <button
              onClick={handleUnlinkParent}
              className="text-xs text-muted-foreground hover:text-red-500"
            >
              상위 이슈 연결 해제
            </button>
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
