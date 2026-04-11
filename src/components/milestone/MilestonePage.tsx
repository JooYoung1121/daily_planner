import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { loadMilestones(); }, [loadMilestones]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const stages = customStages.split(',').map((s) => s.trim()).filter(Boolean);
    if (stages.length === 0) return;
    addMilestone(newName.trim(), newCategory, stages);
    setNewName('');
    setNewCategory('');
    setShowAddForm(false);
  };

  const getCatColor = (name: string) => categories.find((c) => c.name === name)?.color;

  const totalItems = items.length;
  const completedCount = items.filter((i) => i.currentStageIndex >= i.stages.length).length;
  const overallPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageGuide pageId="milestone" title="마일스톤 사용법" tips={[
        '각 작업을 클릭하면 단계가 펼쳐집니다. 단계별로 이름/설명을 수정할 수 있습니다.',
        '단계의 ○ 버튼을 클릭하면 해당 단계까지 완료 처리됩니다.',
        '작업마다 단계 수가 다를 수 있습니다. 단계 추가/삭제도 자유롭게 가능합니다.',
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
            <span className="text-sm font-medium">전체 진행률</span>
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
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="작업 이름" className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">카테고리 선택</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">단계 (쉼표로 구분, 작업마다 다르게 설정 가능)</label>
            <input type="text" value={customStages} onChange={(e) => setCustomStages(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!newName.trim()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">추가</button>
            <button onClick={() => setShowAddForm(false)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">취소</button>
          </div>
        </div>
      )}

      {/* Item list */}
      {items.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card py-12 text-center text-sm text-muted-foreground">마일스톤이 없습니다.</div>
          <button onClick={async () => {
            const seeds = [
              { name: '인테카 포맨 톤 커버 선 로션', cat: '선케어', done: 2 },
              { name: '이온 스플래쉬 미스트', cat: '스킨케어', done: 4 },
              { name: '이온 스플래쉬 크림', cat: '스킨케어', done: 1 },
              { name: '에브리데이 샷 퍼밍 마스크', cat: '마스크팩', done: 0 },
              { name: '노세범선크림플러스', cat: '선케어', done: 0 },
              { name: 'PDRN 버블 클렌저', cat: '클렌징', done: 0 },
            ];
            for (const s of seeds) await addMilestone(s.name, s.cat, DEFAULT_STAGES);
            const loaded = useMilestoneStore.getState().items;
            for (const s of seeds) {
              if (s.done > 0) {
                const item = loaded.find((i) => i.name === s.name);
                if (item) await moveToStage(item.id, s.done);
              }
            }
          }} className="w-full rounded-lg border border-dashed border-border py-4 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground">
            샘플 데이터 로드
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <MilestoneRow
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onDelete={() => setDeleteId(item.id)}
              onMoveToStage={(idx) => moveToStage(item.id, idx)}
              onAddStage={(name) => addStage(item.id, name)}
              onRemoveStage={(stageId) => removeStage(item.id, stageId)}
              onUpdateStage={(stageId, updates) => updateStage(item.id, stageId, updates)}
              getCatColor={getCatColor}
            />
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) deleteMilestone(deleteId); setDeleteId(null); }} title="마일스톤 삭제" description="이 마일스톤을 삭제하시겠습니까?" confirmLabel="삭제" variant="destructive" />
    </div>
  );
}

/* --- Milestone Row (accordion) --- */
function MilestoneRow({ item, expanded, onToggle, onDelete, onMoveToStage, onAddStage, onRemoveStage, onUpdateStage, getCatColor }: {
  item: MilestoneItem;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onMoveToStage: (idx: number) => void;
  onAddStage: (name: string) => void;
  onRemoveStage: (stageId: string) => void;
  onUpdateStage: (stageId: string, updates: { name?: string; description?: string }) => void;
  getCatColor: (name: string) => string | undefined;
}) {
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newStageName, setNewStageName] = useState('');

  const total = item.stages.length;
  const current = Math.min(item.currentStageIndex ?? 0, total);
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  const isComplete = current >= total;
  const catColor = getCatColor(item.category);
  const currentStageName = current < total ? item.stages[current].name : '완료';

  const startEdit = (stage: { id: string; name: string; description: string }) => {
    setEditingStageId(stage.id);
    setEditName(stage.name);
    setEditDesc(stage.description || '');
  };

  const saveEdit = () => {
    if (editingStageId && editName.trim()) {
      onUpdateStage(editingStageId, { name: editName.trim(), description: editDesc.trim() });
      setEditingStageId(null);
    }
  };

  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden transition-shadow', expanded && 'shadow-md', isComplete ? 'border-green-200 dark:border-green-900' : 'border-border')}>
      {/* Header - always visible */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors" onClick={onToggle}>
        {expanded ? <ChevronDown size={16} className="text-muted-foreground shrink-0" /> : <ChevronRight size={16} className="text-muted-foreground shrink-0" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{item.name}</span>
            {catColor && (
              <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0" style={{ backgroundColor: `${catColor}15`, color: catColor }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catColor }} />{item.category}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[200px]">
              <div className={cn('h-full rounded-full transition-all duration-300', isComplete ? 'bg-green-500' : percent >= 50 ? 'bg-blue-500' : percent > 0 ? 'bg-yellow-500' : '')} style={{ width: `${percent}%` }} />
            </div>
            <span className={cn('text-xs font-bold shrink-0', isComplete ? 'text-green-500' : 'text-muted-foreground')}>{percent}%</span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {isComplete ? '완료' : `현재: ${currentStageName}`}
            </span>
          </div>
        </div>

        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="shrink-0 rounded p-1.5 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Expanded: stages */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {item.stages.map((stage, idx) => {
            const isDone = idx < current;
            const isCurrent = idx === current;

            return (
              <div key={stage.id} className={cn(
                'rounded-lg border p-3 transition-colors',
                isCurrent ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20' :
                isDone ? 'border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/10' :
                'border-border',
              )}>
                {editingStageId === stage.id ? (
                  /* Editing mode */
                  <div className="space-y-2">
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="단계 이름" autoFocus />
                    <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" placeholder="설명 (선택)" />
                    <div className="flex gap-1">
                      <button onClick={saveEdit} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"><Check size={12} className="inline mr-1" />저장</button>
                      <button onClick={() => setEditingStageId(null)} className="rounded-md border border-border px-3 py-1 text-xs">취소</button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <div className="flex items-start gap-3">
                    {/* Stage status circle - clickable to set progress */}
                    <button
                      onClick={() => onMoveToStage(isDone ? idx : idx + 1)}
                      className={cn(
                        'shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border-2',
                        isDone ? 'border-green-500 bg-green-500 text-white hover:bg-green-600' :
                        isCurrent ? 'border-blue-500 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300' :
                        'border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary',
                      )}
                      title={isDone ? '완료 취소' : '완료로 변경'}
                    >
                      {isDone ? '✓' : idx + 1}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', isDone && 'line-through text-muted-foreground')}>{stage.name}</p>
                      {stage.description && <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>}
                      {isCurrent && <span className="inline-block mt-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">현재 진행 중</span>}
                    </div>

                    <div className="flex gap-0.5 shrink-0">
                      <button onClick={() => startEdit(stage)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"><Edit2 size={13} /></button>
                      {item.stages.length > 1 && (
                        <button onClick={() => onRemoveStage(stage.id)} className="rounded p-1 text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new stage */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newStageName.trim()) {
                  onAddStage(newStageName.trim());
                  setNewStageName('');
                }
              }}
              placeholder="새 단계 추가..."
              className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={() => { if (newStageName.trim()) { onAddStage(newStageName.trim()); setNewStageName(''); } }}
              disabled={!newStageName.trim()}
              className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:opacity-80 disabled:opacity-50"
            >
              추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
