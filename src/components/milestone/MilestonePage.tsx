import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { useMilestoneStore } from '@/stores/milestoneStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { cn } from '@/lib/utils';

// Default template stages (from the Excel screenshot)
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
  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  // Get all unique stage names across all milestones for table columns
  const allStageNames = useMemo(() => {
    const nameSet = new Set<string>();
    items.forEach((item) => item.stages.forEach((s) => nameSet.add(s.name)));
    return Array.from(nameSet);
  }, [items]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const stages = customStages
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (stages.length === 0) return;
    addMilestone(newName.trim(), newCategory, stages);
    setNewName('');
    setNewCategory('');
    setShowAddForm(false);
  };

  const getCatColor = (catName: string) =>
    categories.find((c) => c.name === catName)?.color;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">마일스톤</h1>
          <p className="text-sm text-muted-foreground">프로젝트별 단계 진행 현황을 관리합니다</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={16} />
          새 마일스톤
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">새 마일스톤 추가</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">이름</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 인테카 포맨 톤 커버 선"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">카테고리</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">카테고리 선택</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              단계 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={customStages}
              onChange={(e) => setCustomStages(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!newName.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              <Plus size={14} /> 추가
            </button>
            <button onClick={() => setShowAddForm(false)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">취소</button>
          </div>
        </div>
      )}

      {/* Milestone table */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-12 text-center">
          <p className="text-sm text-muted-foreground">마일스톤이 없습니다. 새로 추가해보세요.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-semibold text-foreground min-w-[180px]">항목</th>
                <th className="px-3 py-3 text-left font-semibold text-foreground min-w-[100px]">카테고리</th>
                {/* Dynamic stage columns from each milestone's own stages */}
                {allStageNames.map((name) => (
                  <th key={name} className="px-3 py-3 text-center font-medium text-foreground min-w-[100px] whitespace-nowrap">
                    {name}
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-semibold text-foreground min-w-[80px]">진행률</th>
                <th className="px-3 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const total = item.stages.length;
                const done = item.stages.filter((s) => s.done).length;
                const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                const catColor = getCatColor(item.category);

                return (
                  <tr key={item.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    {/* Name */}
                    <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium text-foreground">
                      {item.name}
                    </td>
                    {/* Category */}
                    <td className="px-3 py-3">
                      {item.category && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: catColor ? `${catColor}20` : undefined, color: catColor }}
                        >
                          {catColor && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: catColor }} />}
                          {item.category}
                        </span>
                      )}
                    </td>
                    {/* Stage checkboxes */}
                    {allStageNames.map((stageName) => {
                      const stage = item.stages.find((s) => s.name === stageName);
                      if (!stage) {
                        return <td key={stageName} className="px-3 py-3 text-center text-muted-foreground/30">—</td>;
                      }
                      return (
                        <td key={stageName} className="px-3 py-3 text-center">
                          <button
                            onClick={() => toggleStage(item.id, stage.id)}
                            className="mx-auto block"
                          >
                            {stage.done
                              ? <CheckSquare size={18} className="text-green-500" />
                              : <Square size={18} className="text-muted-foreground/40 hover:text-primary transition-colors" />}
                          </button>
                        </td>
                      );
                    })}
                    {/* Progress */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn(
                          'text-xs font-bold',
                          percent === 100 ? 'text-green-500' :
                          percent >= 50 ? 'text-blue-500' :
                          percent > 0 ? 'text-yellow-600' : 'text-muted-foreground',
                        )}>
                          {percent}%
                        </span>
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              percent === 100 ? 'bg-green-500' :
                              percent >= 50 ? 'bg-blue-500' :
                              percent > 0 ? 'bg-yellow-500' : 'bg-muted',
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="rounded p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick seed from Excel data */}
      {items.length === 0 && (
        <button
          onClick={async () => {
            const seedItems = [
              { name: '인테카 포맨 톤 커버 선', category: '선케어', stages: DEFAULT_STAGES },
              { name: '이온 스플래쉬 미스트', category: '스킨케어', stages: DEFAULT_STAGES },
              { name: '이온 스플래쉬 크림', category: '스킨케어', stages: DEFAULT_STAGES },
              { name: '에브리데이샷 마스크팩', category: '마스크팩', stages: DEFAULT_STAGES },
              { name: '노세범선크림플러스', category: '선케어', stages: DEFAULT_STAGES },
              { name: 'PDRN 버블 클렌저', category: '클렌징', stages: DEFAULT_STAGES },
            ];
            for (const s of seedItems) {
              await addMilestone(s.name, s.category, s.stages);
            }
            // Set initial TRUE values matching the Excel
            const loaded = useMilestoneStore.getState().items;
            const toggleByName = async (itemName: string, stageNames: string[]) => {
              const item = loaded.find((i) => i.name === itemName);
              if (!item) return;
              for (const sn of stageNames) {
                const stage = item.stages.find((s) => s.name === sn);
                if (stage) await toggleStage(item.id, stage.id);
              }
            };
            await toggleByName('인테카 포맨 톤 커버 선', ['컨셉보드&교육', '연출컷 서칭']);
            await toggleByName('이온 스플래쉬 미스트', ['컨셉보드&교육', '연출컷 서칭', '연출컷 기획안', '문안 작성']);
            await toggleByName('이온 스플래쉬 크림', ['컨셉보드&교육']);
          }}
          className="w-full rounded-lg border border-dashed border-border py-4 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          엑셀 샘플 데이터 로드 (신제품 마일스톤 6개)
        </button>
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
