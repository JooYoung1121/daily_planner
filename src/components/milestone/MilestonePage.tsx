import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useMilestoneStore } from '@/stores/milestoneStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageGuide } from '@/components/common/PageGuide';
import { cn } from '@/lib/utils';

const DEFAULT_STAGES = [
  '컨셉보드&교육',
  '연출컷 서칭',
  '연출컷 기획안',
  '문안 작성',
  '내부 QC',
  '디자인팀 전달',
];

export function MilestonePage() {
  const items = useMilestoneStore((s) => s.items);
  const loadMilestones = useMilestoneStore((s) => s.loadMilestones);
  const addMilestone = useMilestoneStore((s) => s.addMilestone);
  const deleteMilestone = useMilestoneStore((s) => s.deleteMilestone);
  const toggleStage = useMilestoneStore((s) => s.toggleStage);
  const categories = useSettingsStore((s) => s.categories);

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [customStages, setCustomStages] = useState(DEFAULT_STAGES.join(', '));
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { loadMilestones(); }, [loadMilestones]);

  // Collect all unique stage names for pipeline columns
  const allStageNames = useMemo(() => {
    if (items.length === 0) return DEFAULT_STAGES;
    const nameSet = new Set<string>();
    items.forEach((item) => item.stages.forEach((s) => nameSet.add(s.name)));
    return Array.from(nameSet);
  }, [items]);

  // Group items by which stage they are currently at (first incomplete stage)
  const itemsByCurrentStage = useMemo(() => {
    const map: Record<string, typeof items> = {};
    const completedItems: typeof items = [];
    allStageNames.forEach((name) => { map[name] = []; });

    items.forEach((item) => {
      const firstIncomplete = item.stages.find((s) => !s.done);
      if (!firstIncomplete) {
        completedItems.push(item);
      } else {
        if (map[firstIncomplete.name]) {
          map[firstIncomplete.name].push(item);
        }
      }
    });
    return { map, completedItems };
  }, [items, allStageNames]);

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

  // Overall stats
  const totalItems = items.length;
  const completedCount = itemsByCurrentStage.completedItems.length;
  const overallPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageGuide pageId="milestone" title="마일스톤 사용법" tips={[
        '각 제품/프로젝트가 현재 어떤 단계에 있는지 파이프라인으로 보여줍니다.',
        '카드를 클릭해서 펼치면 단계별 체크리스트가 나옵니다. 체크하면 다음 단계로 이동합니다.',
        '하단 "항목별 진행률"에서 전체 진행 상황을 바 차트로 확인할 수 있습니다.',
        '"새 마일스톤" 버튼으로 새 항목을 추가하고, 단계를 쉼표로 커스텀할 수 있습니다.',
      ]} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">마일스톤</h1>
          <p className="text-sm text-muted-foreground">프로젝트별 단계 진행 현황</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={16} /> 새 마일스톤
        </button>
      </div>

      {/* Overall progress bar */}
      {totalItems > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">전체 진행률</span>
            <span className="text-sm font-bold text-foreground">{completedCount}/{totalItems} 완료 ({overallPercent}%)</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', overallPercent === 100 ? 'bg-green-500' : 'bg-blue-500')}
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">새 마일스톤 추가</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">이름</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="예: 인테카 포맨 톤 커버 선" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">카테고리</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">카테고리 선택</option>
                {categories.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">단계 (쉼표로 구분)</label>
            <input type="text" value={customStages} onChange={(e) => setCustomStages(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!newName.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"><Plus size={14} /> 추가</button>
            <button onClick={() => setShowAddForm(false)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">취소</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card py-12 text-center">
            <p className="text-sm text-muted-foreground">마일스톤이 없습니다. 새로 추가해보세요.</p>
          </div>
          <button
            onClick={async () => {
              // 제품관련 시트 기반 시드 데이터
              const seedItems: { name: string; category: string; stages: string[]; done: string[] }[] = [
                { name: '인테카 포맨 톤 커버 선 로션', category: '선케어', stages: DEFAULT_STAGES, done: ['컨셉보드&교육', '연출컷 서칭'] },
                { name: '이온 스플래쉬 미스트', category: '스킨케어', stages: DEFAULT_STAGES, done: ['컨셉보드&교육', '연출컷 서칭', '연출컷 기획안', '문안 작성'] },
                { name: '이온 스플래쉬 크림', category: '스킨케어', stages: DEFAULT_STAGES, done: ['컨셉보드&교육'] },
                { name: '에브리데이 샷 퍼밍 마스크', category: '마스크팩', stages: DEFAULT_STAGES, done: [] },
                { name: '에브리데이 샷 카밍 마스크', category: '마스크팩', stages: DEFAULT_STAGES, done: [] },
                { name: '에브리데이 샷 브라이트닝 마스크', category: '마스크팩', stages: DEFAULT_STAGES, done: [] },
                { name: '노세범선크림플러스', category: '선케어', stages: DEFAULT_STAGES, done: [] },
                { name: 'PDRN 버블 클렌저', category: '클렌징', stages: DEFAULT_STAGES, done: [] },
                { name: 'PDRN 선세럼', category: '선케어', stages: DEFAULT_STAGES, done: [] },
                { name: 'NMN 선세럼', category: '선케어', stages: DEFAULT_STAGES, done: [] },
              ];
              for (const s of seedItems) await addMilestone(s.name, s.category, s.stages);
              const loaded = useMilestoneStore.getState().items;
              for (const s of seedItems) {
                if (s.done.length === 0) continue;
                const item = loaded.find((i) => i.name === s.name);
                if (!item) continue;
                for (const sn of s.done) {
                  const stage = item.stages.find((st) => st.name === sn);
                  if (stage) await toggleStage(item.id, stage.id);
                }
              }
            }}
            className="w-full rounded-lg border border-dashed border-border py-4 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            샘플 데이터 로드 (신제품 마일스톤 10개)
          </button>
        </div>
      ) : (
        <>
          {/* Pipeline columns */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {allStageNames.map((stageName, stageIdx) => {
              const stageItems = itemsByCurrentStage.map[stageName] || [];
              return (
                <div key={stageName} className="flex-shrink-0 w-56 flex flex-col">
                  {/* Column header */}
                  <div className="rounded-t-lg border border-border bg-muted/50 px-3 py-2.5 border-b-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{stageName}</span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{stageItems.length}</span>
                    </div>
                    {/* Stage index indicator */}
                    <div className="mt-1.5 flex gap-0.5">
                      {allStageNames.map((_, i) => (
                        <div key={i} className={cn('h-1 flex-1 rounded-full', i <= stageIdx ? 'bg-blue-500' : 'bg-muted')} />
                      ))}
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 rounded-b-lg border border-border border-t-0 bg-card p-2 space-y-2 min-h-[120px]">
                    {stageItems.map((item) => (
                      <MilestoneCard
                        key={item.id}
                        item={item}
                        expanded={expandedId === item.id}
                        onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        onToggleStage={(stageId) => toggleStage(item.id, stageId)}
                        onDelete={() => setDeleteId(item.id)}
                        getCatColor={getCatColor}
                      />
                    ))}
                    {stageItems.length === 0 && (
                      <p className="py-4 text-center text-[10px] text-muted-foreground/40">비어있음</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Completed column */}
            <div className="flex-shrink-0 w-56 flex flex-col">
              <div className="rounded-t-lg border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 px-3 py-2.5 border-b-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">완료</span>
                  <span className="rounded-full bg-green-100 dark:bg-green-900/50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">{itemsByCurrentStage.completedItems.length}</span>
                </div>
                <div className="mt-1.5 flex gap-0.5">
                  {allStageNames.map((_, i) => (
                    <div key={i} className="h-1 flex-1 rounded-full bg-green-500" />
                  ))}
                </div>
              </div>
              <div className="flex-1 rounded-b-lg border border-green-200 dark:border-green-900 border-t-0 bg-green-50/20 dark:bg-green-950/10 p-2 space-y-2 min-h-[120px]">
                {itemsByCurrentStage.completedItems.map((item) => (
                  <MilestoneCard
                    key={item.id}
                    item={item}
                    expanded={expandedId === item.id}
                    onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    onToggleStage={(stageId) => toggleStage(item.id, stageId)}
                    onDelete={() => setDeleteId(item.id)}
                    getCatColor={getCatColor}
                    completed
                  />
                ))}
                {itemsByCurrentStage.completedItems.length === 0 && (
                  <p className="py-4 text-center text-[10px] text-muted-foreground/40">비어있음</p>
                )}
              </div>
            </div>
          </div>

          {/* Per-item progress overview */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">항목별 진행률</h3>
            <div className="space-y-3">
              {items.map((item) => {
                const done = item.stages.filter((s) => s.done).length;
                const total = item.stages.length;
                const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                const catColor = getCatColor(item.category);
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-40 shrink-0 truncate text-sm font-medium text-foreground">{item.name}</div>
                    {catColor && (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${catColor}20`, color: catColor }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                        {item.category}
                      </span>
                    )}
                    <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', percent === 100 ? 'bg-green-500' : percent >= 50 ? 'bg-blue-500' : percent > 0 ? 'bg-yellow-500' : 'bg-muted')}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className={cn('shrink-0 text-xs font-bold w-10 text-right', percent === 100 ? 'text-green-500' : percent >= 50 ? 'text-blue-500' : percent > 0 ? 'text-yellow-600' : 'text-muted-foreground')}>
                      {percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMilestone(deleteId); setDeleteId(null); }}
        title="마일스톤 삭제"
        description="이 마일스톤을 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="destructive"
      />
    </div>
  );
}

/* --- Milestone Card --- */

function MilestoneCard({
  item, expanded, onToggleExpand, onToggleStage, onDelete, getCatColor, completed,
}: {
  item: { id: string; name: string; category: string; stages: { id: string; name: string; done: boolean }[] };
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleStage: (stageId: string) => void;
  onDelete: () => void;
  getCatColor: (name: string) => string | undefined;
  completed?: boolean;
}) {
  const done = item.stages.filter((s) => s.done).length;
  const total = item.stages.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const catColor = getCatColor(item.category);

  return (
    <div className={cn(
      'rounded-md border bg-background p-2.5 transition-shadow hover:shadow-md',
      completed ? 'border-green-200 dark:border-green-900' : 'border-border',
    )}>
      {/* Card header */}
      <div className="flex items-start justify-between gap-1">
        <button onClick={onToggleExpand} className="flex items-start gap-1.5 text-left flex-1 min-w-0">
          {expanded ? <ChevronDown size={14} className="shrink-0 mt-0.5 text-muted-foreground" /> : <ChevronRight size={14} className="shrink-0 mt-0.5 text-muted-foreground" />}
          <span className={cn('text-xs font-semibold leading-tight', completed && 'text-green-700 dark:text-green-400')}>
            {item.name}
          </span>
        </button>
        <button onClick={onDelete} className="shrink-0 rounded p-0.5 text-muted-foreground/40 hover:text-red-500">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Category */}
      {item.category && catColor && (
        <div className="mt-1 ml-5">
          <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ backgroundColor: `${catColor}15`, color: catColor }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catColor }} />
            {item.category}
          </span>
        </div>
      )}

      {/* Mini progress */}
      <div className="mt-2 ml-5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', percent === 100 ? 'bg-green-500' : 'bg-blue-500')}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">{done}/{total}</span>
        </div>
      </div>

      {/* Expanded: stage checklist */}
      {expanded && (
        <div className="mt-2 ml-5 space-y-1 border-t border-border pt-2">
          {item.stages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => onToggleStage(stage.id)}
              className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-accent/50 transition-colors"
            >
              <div className={cn(
                'shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center',
                stage.done ? 'border-green-500 bg-green-500' : 'border-muted-foreground/30',
              )}>
                {stage.done && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className={cn('text-[11px]', stage.done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                {stage.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
