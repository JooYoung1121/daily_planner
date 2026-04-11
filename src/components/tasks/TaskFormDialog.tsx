import { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, Recurrence, RecurrenceType } from '@/types/task';
import { STATUS_LABELS, PRIORITY_LABELS, RECURRENCE_LABELS, DAY_LABELS } from '@/lib/constants';
import { useSettingsStore, type CategoryItem } from '@/stores/settingsStore';
import { useTaskStore } from '@/stores/taskStore';
import { cn } from '@/lib/utils';

interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  task?: Task | null;
  defaultDate?: string;
  defaultStatus?: TaskStatus;
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  tags: string[];
  dueDate: string | null;
  dueTime: string | null;
  recurrence: Recurrence | null;
  parentId: string | null;
}

const INITIAL: TaskFormData = {
  title: '',
  description: '',
  status: 'open',
  priority: 'medium',
  category: '',
  tags: [],
  dueDate: null,
  dueTime: null,
  recurrence: null,
  parentId: null,
};

export function TaskFormDialog({
  open,
  onClose,
  onSubmit,
  task,
  defaultDate,
  defaultStatus,
}: TaskFormDialogProps) {
  const [form, setForm] = useState<TaskFormData>(INITIAL);
  const [tagInput, setTagInput] = useState('');
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [showNewCat, setShowNewCat] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  const categories = useSettingsStore((s) => s.categories);
  const addCategory = useSettingsStore((s) => s.addCategory);
  const allTasks = useTaskStore((s) => s.tasks);

  // Collect all existing tags from tasks for suggestions
  const suggestedTags = useMemo(() => {
    const tagSet = new Set<string>();
    allTasks.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [allTasks]);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        tags: [...task.tags],
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        recurrence: task.recurrence ?? null,
        parentId: task.parentId ?? null,
      });
    } else {
      setForm({
        ...INITIAL,
        dueDate: defaultDate ?? null,
        status: defaultStatus ?? 'open',
      });
    }
    setTagInput('');
    setCatDropdownOpen(false);
    setShowNewCat(false);
  }, [task, defaultDate, defaultStatus, open]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    }
    if (catDropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [catDropdownOpen]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
    onClose();
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
      setTagInput('');
    }
  };

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter((t) => t !== tag)
        : [...f.tags, tag],
    }));
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const selectCategory = (cat: CategoryItem) => {
    setForm((f) => ({ ...f, category: cat.name }));
    setCatDropdownOpen(false);
  };

  const handleAddNewCategory = () => {
    if (newCatName.trim()) {
      addCategory(newCatName.trim(), newCatColor);
      setForm((f) => ({ ...f, category: newCatName.trim() }));
      setNewCatName('');
      setShowNewCat(false);
      setCatDropdownOpen(false);
    }
  };

  const selectedCat = categories.find((c) => c.name === form.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">
            {task ? '업무 수정' : '새 업무'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              제목 *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="업무 제목을 입력하세요"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              설명
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="업무 상세 내용"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                상태
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                우선순위
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date + time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">마감일</label>
              <input
                type="date"
                value={form.dueDate ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value || null }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">마감 시간</label>
              <input
                type="time"
                value={form.dueTime ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, dueTime: e.target.value || null }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              카테고리
            </label>
            <div ref={catRef} className="relative">
              <button
                type="button"
                onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <span className="flex items-center gap-2">
                  {selectedCat ? (
                    <>
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: selectedCat.color }}
                      />
                      {selectedCat.name}
                    </>
                  ) : form.category ? (
                    form.category
                  ) : (
                    <span className="text-muted-foreground">카테고리 선택</span>
                  )}
                </span>
                <ChevronDown size={16} className={cn('text-muted-foreground transition-transform', catDropdownOpen && 'rotate-180')} />
              </button>

              {catDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
                  {/* Clear selection */}
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, category: '' }));
                      setCatDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
                  >
                    선택 안함
                  </button>

                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => selectCategory(cat)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent',
                        form.category === cat.name && 'bg-accent font-medium',
                      )}
                    >
                      <span
                        className="inline-block h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </button>
                  ))}

                  {/* Add new category inline */}
                  <div className="border-t border-border">
                    {showNewCat ? (
                      <div className="p-2 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={newCatColor}
                            onChange={(e) => setNewCatColor(e.target.value)}
                            className="h-8 w-8 cursor-pointer rounded border-0 p-0"
                          />
                          <input
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddNewCategory();
                              }
                            }}
                            placeholder="새 카테고리 이름"
                            className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={handleAddNewCategory}
                            className="flex-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                          >
                            추가
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowNewCat(false)}
                            className="flex-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowNewCat(true)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-primary hover:bg-accent"
                      >
                        <Plus size={14} />
                        새 카테고리 추가
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags with suggestions */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              태그
            </label>

            {/* Suggested tags */}
            {suggestedTags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                      form.tags.includes(tag)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                    )}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Manual tag input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="새 태그 입력 후 Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:opacity-80"
              >
                추가
              </button>
            </div>

            {/* Selected tags */}
            {form.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-xs text-primary font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recurrence */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              반복
            </label>
            <div className="flex items-center gap-2">
              <select
                value={form.recurrence?.type ?? ''}
                onChange={(e) => {
                  if (!e.target.value) {
                    setForm((f) => ({ ...f, recurrence: null }));
                  } else {
                    setForm((f) => ({
                      ...f,
                      recurrence: {
                        type: e.target.value as RecurrenceType,
                        interval: f.recurrence?.interval ?? 1,
                      },
                    }));
                  }
                }}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">반복 없음</option>
                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {form.recurrence && form.recurrence.type !== 'weekdays' && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={form.recurrence.interval}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        recurrence: f.recurrence
                          ? { ...f.recurrence, interval: parseInt(e.target.value) || 1 }
                          : null,
                      }))
                    }
                    className="w-14 rounded-md border border-input bg-background px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span>
                    {form.recurrence.type === 'daily' ? '일' : form.recurrence.type === 'weekly' ? '주' : '월'}마다
                  </span>
                </div>
              )}
              {form.recurrence?.type === 'weekdays' && (
                <div className="flex items-center gap-1">
                  {DAY_LABELS.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          recurrence: f.recurrence
                            ? { ...f.recurrence, dayOfWeek: i, interval: 1 }
                            : null,
                        }))
                      }
                      className={cn(
                        'w-7 h-7 rounded-full text-xs font-medium border transition-colors',
                        form.recurrence?.dayOfWeek === i
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground hover:bg-accent',
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {task ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
