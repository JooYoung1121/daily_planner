import { useState, useEffect, useMemo } from 'react';
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
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Edit2, Check, X, GripVertical } from 'lucide-react';
import { useMilestoneStore } from '@/stores/milestoneStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageGuide } from '@/components/common/PageGuide';
import { cn } from '@/lib/utils';
import type { MilestoneItem } from '@/types/milestone';

const DEFAULT_STAGES = ['컨셉보드&교육', '연출컷 서칭', '연출컷 기획안', '문안 작성', '내부 QC', '디자인팀 전달'];

export function MilestonePage() {
  const items = useMilestoneStore((s) => s.items);
  const loadMilestones = useMilestoneStore((s) => s.loadMilestones);
  const addMilestone = useMilestoneStore((s) => s.addMilestone);
  const deleteMilestone = useMilestoneStore((s) => s.deleteMilestone);
  const moveToStage = useMilestoneStore((s) => s.moveToStage);
  const addStage = useMilestoneStore((s) => s.addStage);
  const removeStage = useMilestoneStore((s) => s.removeStage);
  const updateStage = useMilestoneStore((s) => s.updateStage);
  const categories = useSettingsStore((s) => s.categories);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [customStages, setCustomStages] = useState(DEFAULT_STAGES.join(', '));
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MilestoneItem | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => { loadMilestones(); }, [loadMilestones]);

  // Collect all unique stage names for pipeline columns
  const allStageNames = useMemo(() => {
    if (items.length === 0) return DEFAULT_STAGES;
    const nameSet = new Set<string>();
    items.forEach((item) => item.stages.forEach((s) => nameSet.add(s.name)));
    return Array.from(nameSet);
  }, [items]);

  // Group items by current stage
  const itemsByStage = useMemo(() => {
    const map: Record<string, MilestoneItem[]> = {};
    const completed: MilestoneItem[] = [];
    allStageNames.forEach((name) => { map[name] = []; });
    items.forEach((item) => {
      const idx = item.currentStageIndex ?? item.stages.findIndex((s) => !s.done);
      if (idx >= item.stages.length || idx === -1) {
        completed.push(item);
      } else {
        const stageName = item.stages[idx]?.name;
        if (stageName && map[stageName]) map[stageName].push(item);
        else completed.push(item);
      }
    });
    return { map, completed };
  }, [items, allStageNames]);

  const activeItem = useMemo(() => items.find((i) => i.id === activeId) ?? null, [items, activeId]);

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const itemId = active.id as string;
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const targetColumn = over.id as string;
    // Find stage index in this item's stages
    if (targetColumn === '__completed__') {
      moveToStage(itemId, item.stages.length);
    } else {
      const stageIdx = item.stages.findIndex((s) => s.name === targetColumn);
      if (stageIdx !== -1) {
        moveToStage(itemId, stageIdx);
      }
    }
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const stages = customStages.split(',').map((s) => s.trim()).filter(Boolean);
    if (stages.length === 0) return;
    addMilestone(newName.trim(), newCategory, stages);
    setNewName('');
    setNewCategory('');
    setShowAddForm(false);
  };

  const getCatColor = (catName: string) => categories.find((c) => c.name === catName)?.color;

  // Stats
  const totalItems = items.length;
  const completedCount = itemsByStage.completed.length;
  const overallPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageGuide pageId="milestone" title="마일스톤 사용법" tips={[
        '카드를 드래그하여 단계 간 이동하면 진행 상태가 자동 업데이트됩니다.',
        '카드를 클릭하면 단계별 상세 편집이 가능합니다 (이름, 설명 수정/추가/삭제).',
        '각 작업마다 단계를 다르게 설정할 수 있습니다.',
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">마일스톤</h1>
          <p className="text-sm text-muted-foreground">프로젝트별 단계 진행 현황</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus size={16} /> 새 마일스톤
        </button>
      </div>

      {/* Overall progress */}
      {totalItems > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">전체 진행률</span>
            <span className="text-sm font-bold">{completedCount}/{totalItems} 완료 ({overallPercent}%)</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-500', overallPercent === 100 ? 'bg-green-500' : 'bg-blue-500')} style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">새 마일스톤 추가</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="이름" className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">카테고리 선택</option>
              {categories.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">단계 (쉼표로 구분)</label>
            <input type="text" value={customStages} onChange={(e) => setCustomStages(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!newName.trim()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"><Plus size={14} className="inline mr-1" />추가</button>
            <button onClick={() => setShowAddForm(false)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">취소</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card py-12 text-center">
            <p className="text-sm text-muted-foreground">마일스톤이 없습니다.</p>
          </div>
          <button onClick={async () => {
            const seeds = [
              { name: '인테카 포맨 톤 커버 선 로션', category: '선케어', stages: DEFAULT_STAGES },
              { name: '이온 스플래쉬 미스트', category: '스킨케어', stages: DEFAULT_STAGES },
              { name: '이온 스플래쉬 크림', category: '스킨케어', stages: DEFAULT_STAGES },
              { name: '에브리데이 샷 퍼밍 마스크', category: '마스크팩', stages: DEFAULT_STAGES },
              { name: '노세범선크림플러스', category: '선케어', stages: DEFAULT_STAGES },
              { name: 'PDRN 버블 클렌저', category: '클렌징', stages: DEFAULT_STAGES },
            ];
            for (const s of seeds) await addMilestone(s.name, s.category, s.stages);
            // Set progress
            const loaded = useMilestoneStore.getState().items;
            const move = (name: string, idx: number) => {
              const item = loaded.find((i) => i.name === name);
              if (item) moveToStage(item.id, idx);
            };
            move('인테카 포맨 톤 커버 선 로션', 2);
            move('이온 스플래쉬 미스트', 4);
            move('이온 스플래쉬 크림', 1);
          }} className="w-full rounded-lg border border-dashed border-border py-4 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground">
            샘플 데이터 로드
          </button>
        </div>
      ) : (
        <>
          {/* Pipeline with DnD */}
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allStageNames.map((stageName, stageIdx) => (
                <PipelineColumn key={stageName} id={stageName} label={stageName} stageIndex={stageIdx} totalStages={allStageNames.length} items={itemsByStage.map[stageName] || []} onEdit={setEditingItem} onDelete={setDeleteId} getCatColor={getCatColor} />
              ))}
              <PipelineColumn id="__completed__" label="완료" stageIndex={allStageNames.length} totalStages={allStageNames.length} items={itemsByStage.completed} onEdit={setEditingItem} onDelete={setDeleteId} getCatColor={getCatColor} completed />
            </div>
            <DragOverlay>
              {activeItem && <DragCard item={activeItem} getCatColor={getCatColor} />}
            </DragOverlay>
          </DndContext>

          {/* Progress bars */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">항목별 진행률</h3>
            <div className="space-y-3">
              {items.map((item) => {
                const total = item.stages.length;
                const current = item.currentStageIndex ?? 0;
                const percent = total > 0 ? Math.round((Math.min(current, total) / total) * 100) : 0;
                const catColor = getCatColor(item.category);
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-sm font-medium">{item.name}</span>
                    {catColor && <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${catColor}20`, color: catColor }}>{item.category}</span>}
                    <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-500', percent === 100 ? 'bg-green-500' : percent >= 50 ? 'bg-blue-500' : percent > 0 ? 'bg-yellow-500' : '')} style={{ width: `${percent}%` }} />
                    </div>
                    <span className={cn('shrink-0 text-xs font-bold w-10 text-right', percent === 100 ? 'text-green-500' : percent >= 50 ? 'text-blue-500' : percent > 0 ? 'text-yellow-600' : 'text-muted-foreground')}>{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Edit panel */}
      {editingItem && (() => {
        const item = items.find((i) => i.id === editingItem.id);
        return item ? (
          <EditPanel item={item} onClose={() => setEditingItem(null)} onAddStage={addStage} onRemoveStage={removeStage} onUpdateStage={updateStage} getCatColor={getCatColor} />
        ) : null;
      })()}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) deleteMilestone(deleteId); setDeleteId(null); }} title="마일스톤 삭제" description="이 마일스톤을 삭제하시겠습니까?" confirmLabel="삭제" variant="destructive" />
    </div>
  );
}

/* --- Pipeline Column --- */
function PipelineColumn({ id, label, stageIndex, totalStages, items, onEdit, onDelete, getCatColor, completed }: {
  id: string; label: string; stageIndex: number; totalStages: number;
  items: MilestoneItem[]; onEdit: (item: MilestoneItem) => void; onDelete: (id: string) => void;
  getCatColor: (name: string) => string | undefined; completed?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="flex-shrink-0 w-56 flex flex-col">
      <div className={cn('rounded-t-lg border border-b-0 px-3 py-2.5', completed ? 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20' : 'border-border bg-muted/50', isOver && 'ring-2 ring-primary/50')}>
        <div className="flex items-center justify-between">
          <span className={cn('text-xs font-semibold', completed ? 'text-green-700 dark:text-green-400' : 'text-foreground')}>{label}</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{items.length}</span>
        </div>
        <div className="mt-1.5 flex gap-0.5">
          {Array.from({ length: totalStages }).map((_, i) => (
            <div key={i} className={cn('h-1 flex-1 rounded-full', i <= stageIndex ? (completed ? 'bg-green-500' : 'bg-blue-500') : 'bg-muted')} />
          ))}
        </div>
      </div>
      <div ref={setNodeRef} className={cn('flex-1 rounded-b-lg border border-t-0 p-2 space-y-2 min-h-[120px]', completed ? 'border-green-200 dark:border-green-900 bg-green-50/20 dark:bg-green-950/10' : 'border-border bg-card', isOver && 'bg-primary/5')}>
        {items.map((item) => (
          <DraggableCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} getCatColor={getCatColor} />
        ))}
        {items.length === 0 && <p className="py-4 text-center text-[10px] text-muted-foreground/40">비어있음</p>}
      </div>
    </div>
  );
}

/* --- Draggable Card --- */
function DraggableCard({ item, onEdit, onDelete, getCatColor }: {
  item: MilestoneItem; onEdit: (item: MilestoneItem) => void; onDelete: (id: string) => void;
  getCatColor: (name: string) => string | undefined;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const catColor = getCatColor(item.category);
  const done = Math.min(item.currentStageIndex ?? 0, item.stages.length);
  const total = item.stages.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div ref={setNodeRef} style={style} className="rounded-md border border-border bg-background p-2.5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-1.5">
        <div {...attributes} {...listeners} className="mt-0.5 cursor-grab text-muted-foreground/40 hover:text-muted-foreground"><GripVertical size={12} /></div>
        <div className="flex-1 min-w-0">
          <button onClick={() => onEdit(item)} className="text-xs font-semibold text-foreground text-left hover:text-primary w-full truncate block">{item.name}</button>
          {catColor && (
            <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium mt-0.5" style={{ backgroundColor: `${catColor}15`, color: catColor }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catColor }} />{item.category}
            </span>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={cn('h-full rounded-full', percent === 100 ? 'bg-green-500' : 'bg-blue-500')} style={{ width: `${percent}%` }} />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">{done}/{total}</span>
          </div>
        </div>
        <button onClick={() => onDelete(item.id)} className="shrink-0 rounded p-0.5 text-muted-foreground/30 hover:text-red-500"><Trash2 size={11} /></button>
      </div>
    </div>
  );
}

function DragCard({ item, getCatColor }: { item: MilestoneItem; getCatColor: (name: string) => string | undefined }) {
  const catColor = getCatColor(item.category);
  return (
    <div className="rounded-md border border-primary bg-card p-2.5 shadow-lg rotate-2 w-56">
      <p className="text-xs font-semibold">{item.name}</p>
      {catColor && <span className="text-[9px]" style={{ color: catColor }}>{item.category}</span>}
    </div>
  );
}

/* --- Edit Panel --- */
function EditPanel({ item, onClose, onAddStage, onRemoveStage, onUpdateStage, getCatColor }: {
  item: MilestoneItem; onClose: () => void;
  onAddStage: (id: string, name: string) => Promise<void>;
  onRemoveStage: (id: string, stageId: string) => Promise<void>;
  onUpdateStage: (id: string, stageId: string, updates: { name?: string; description?: string }) => Promise<void>;
  getCatColor: (name: string) => string | undefined;
}) {
  const [newStageName, setNewStageName] = useState('');
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const catColor = getCatColor(item.category);

  const startEdit = (stage: { id: string; name: string; description: string }) => {
    setEditingStageId(stage.id);
    setEditName(stage.name);
    setEditDesc(stage.description);
  };

  const saveEdit = () => {
    if (editingStageId && editName.trim()) {
      onUpdateStage(item.id, editingStageId, { name: editName.trim(), description: editDesc.trim() });
      setEditingStageId(null);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto h-full w-[440px] max-w-full border-l border-border bg-card shadow-xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3">
          <h3 className="text-sm font-semibold text-muted-foreground">마일스톤 상세</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">{item.name}</h2>
            {catColor && (
              <span className="inline-flex items-center gap-1.5 mt-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${catColor}20`, color: catColor }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: catColor }} />{item.category}
              </span>
            )}
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">진행률</span>
              <span className="text-xs font-bold">{Math.min(item.currentStageIndex, item.stages.length)}/{item.stages.length}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${item.stages.length ? (Math.min(item.currentStageIndex, item.stages.length) / item.stages.length) * 100 : 0}%` }} />
            </div>
          </div>

          {/* Stages */}
          <div>
            <label className="mb-2 block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">단계 목록</label>
            <div className="space-y-2">
              {item.stages.map((stage, idx) => {
                const isCurrent = idx === item.currentStageIndex;
                const isDone = idx < item.currentStageIndex;
                return (
                  <div key={stage.id} className={cn('rounded-lg border p-3', isCurrent ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20' : isDone ? 'border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/10' : 'border-border')}>
                    {editingStageId === stage.id ? (
                      <div className="space-y-2">
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="단계 이름" />
                        <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" placeholder="설명 (선택)" />
                        <div className="flex gap-1">
                          <button onClick={saveEdit} className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground"><Check size={12} /></button>
                          <button onClick={() => setEditingStageId(null)} className="rounded border border-border px-2 py-1 text-xs"><X size={12} /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className={cn('shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold', isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground')}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium', isDone && 'line-through text-muted-foreground')}>{stage.name}</p>
                          {stage.description && <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>}
                          {isCurrent && <span className="inline-block mt-1 text-[10px] font-medium text-blue-600 dark:text-blue-400">현재 진행 중</span>}
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          <button onClick={() => startEdit(stage)} className="rounded p-1 text-muted-foreground hover:bg-accent"><Edit2 size={12} /></button>
                          <button onClick={() => onRemoveStage(item.id, stage.id)} className="rounded p-1 text-muted-foreground hover:text-red-500"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add stage */}
            <div className="mt-2 flex gap-2">
              <input value={newStageName} onChange={(e) => setNewStageName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newStageName.trim()) { onAddStage(item.id, newStageName.trim()); setNewStageName(''); } }} placeholder="새 단계 추가..." className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              <button onClick={() => { if (newStageName.trim()) { onAddStage(item.id, newStageName.trim()); setNewStageName(''); } }} className="rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground">추가</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
