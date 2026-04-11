import { useState, useRef } from 'react';
import { Download, Upload, Trash2, Moon, Sun, Monitor, Plus, Edit2, X, Check, ToggleLeft, ToggleRight, FileSpreadsheet, Database } from 'lucide-react';
import { useSettingsStore, type CategoryItem } from '@/stores/settingsStore';
import { useTaskStore } from '@/stores/taskStore';
import { useDailyLogStore } from '@/stores/dailyLogStore';
import { exportAllData, importAllData, clearAllData, downloadJson } from '@/lib/export';
import { forceLoadSeedData, importFromExcel } from '@/lib/seed';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { cn } from '@/lib/utils';
import type { Theme } from '@/types/settings';

const THEMES: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: '라이트' },
  { value: 'dark', icon: Moon, label: '다크' },
  { value: 'system', icon: Monitor, label: '시스템' },
];

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6b7280',
];

export function SettingsPage() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const categories = useSettingsStore((s) => s.categories);
  const addCategory = useSettingsStore((s) => s.addCategory);
  const updateCategory = useSettingsStore((s) => s.updateCategory);
  const deleteCategory = useSettingsStore((s) => s.deleteCategory);
  const routines = useSettingsStore((s) => s.routines);
  const addRoutine = useSettingsStore((s) => s.addRoutine);
  const deleteRoutine = useSettingsStore((s) => s.deleteRoutine);
  const toggleRoutine = useSettingsStore((s) => s.toggleRoutine);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadEntries = useDailyLogStore((s) => s.loadEntries);

  const [clearOpen, setClearOpen] = useState(false);
  const [seedOpen, setSeedOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);
  const excelRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Category management state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  // Routine management state
  const [newRoutineTime, setNewRoutineTime] = useState('09:00');
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineDays, setNewRoutineDays] = useState<number[]>([]);
  const [deleteRoutineId, setDeleteRoutineId] = useState<string | null>(null);

  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const filename = `daily-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
      downloadJson(data, filename);
      setMessage({ type: 'success', text: '데이터를 내보냈습니다.' });
    } catch {
      setMessage({ type: 'error', text: '내보내기에 실패했습니다.' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      await importAllData(text);
      await loadTasks();
      await loadEntries();
      setMessage({ type: 'success', text: '데이터를 가져왔습니다.' });
    } catch {
      setMessage({ type: 'error', text: '가져오기에 실패했습니다. 올바른 JSON 파일인지 확인하세요.' });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleClear = async () => {
    await clearAllData();
    await loadTasks();
    await loadEntries();
    setMessage({ type: 'success', text: '모든 데이터를 삭제했습니다.' });
  };

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addCategory(newCatName.trim(), newCatColor);
      setNewCatName('');
      setNewCatColor('#3b82f6');
    }
  };

  const startEditCat = (cat: CategoryItem) => {
    setEditingCat(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const saveEditCat = () => {
    if (editingCat && editName.trim()) {
      updateCategory(editingCat, editName.trim(), editColor);
      setEditingCat(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">설정</h1>

      {message && (
        <div
          className={cn(
            'rounded-md p-3 text-sm',
            message.type === 'success'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          )}
        >
          {message.text}
        </div>
      )}

      {/* Theme */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">테마</h2>
        <div className="flex gap-3">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                theme === t.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-foreground hover:bg-accent',
              )}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Category Management */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">카테고리 관리</h2>
        <p className="text-sm text-muted-foreground">
          업무에 사용할 카테고리를 추가하고 관리합니다.
        </p>

        {/* Existing categories */}
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5"
            >
              {editingCat === cat.id ? (
                <>
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded border-0 p-0"
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEditCat()}
                    className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                  />
                  <button onClick={saveEditCat} className="rounded-md p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingCat(null)} className="rounded-md p-1 text-muted-foreground hover:bg-accent">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="inline-block h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-foreground">{cat.name}</span>
                  <button onClick={() => startEditCat(cat)} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => setDeleteCatId(cat.id)} className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new category */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewCatColor(c)}
                className={cn(
                  'h-6 w-6 rounded-full border-2 transition-transform',
                  newCatColor === c ? 'border-foreground scale-110' : 'border-transparent',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="color"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
            className="h-9 w-9 cursor-pointer rounded border-0 p-0"
          />
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="새 카테고리 이름"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCatName.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={16} />
            추가
          </button>
        </div>
      </section>

      {/* Routine Management */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">고정 루틴</h2>
        <p className="text-sm text-muted-foreground">
          매일 반복되는 할일을 등록하면 오늘의 할일에 자동으로 추가됩니다.
        </p>

        {/* Existing routines */}
        {routines.length > 0 && (
          <div className="space-y-2">
            {routines.map((routine) => (
              <div key={routine.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
                <button onClick={() => toggleRoutine(routine.id)} className="shrink-0" title={routine.enabled ? '비활성화' : '활성화'}>
                  {routine.enabled
                    ? <ToggleRight size={20} className="text-green-500" />
                    : <ToggleLeft size={20} className="text-muted-foreground" />}
                </button>
                <span className="text-sm font-mono text-muted-foreground w-14 shrink-0">{routine.time}</span>
                <div className="flex-1 min-w-0">
                  <span className={cn('text-sm font-medium', !routine.enabled && 'text-muted-foreground')}>{routine.title}</span>
                  {routine.days.length > 0 && (
                    <div className="flex gap-1 mt-0.5">
                      {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                        <span key={i} className={cn('text-[10px] w-4 text-center', routine.days.includes(i) ? 'text-primary font-bold' : 'text-muted-foreground/30')}>{d}</span>
                      ))}
                    </div>
                  )}
                  {routine.days.length === 0 && (
                    <span className="text-[10px] text-muted-foreground">매일</span>
                  )}
                </div>
                <button onClick={() => setDeleteRoutineId(routine.id)} className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new routine */}
        <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
          <div className="flex gap-2">
            <input
              type="time"
              value={newRoutineTime}
              onChange={(e) => setNewRoutineTime(e.target.value)}
              className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="text"
              value={newRoutineTitle}
              onChange={(e) => setNewRoutineTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newRoutineTitle.trim()) {
                  addRoutine(newRoutineTime, newRoutineTitle.trim(), newRoutineDays);
                  setNewRoutineTitle('');
                  setNewRoutineDays([]);
                }
              }}
              placeholder="루틴 이름 (예: 스탠드업 미팅)"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">요일:</span>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <button
                key={i}
                onClick={() => setNewRoutineDays((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])}
                className={cn(
                  'w-7 h-7 rounded-full text-xs font-medium border transition-colors',
                  newRoutineDays.includes(i)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent',
                )}
              >
                {d}
              </button>
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">미선택 = 매일</span>
          </div>
          <button
            onClick={() => {
              if (newRoutineTitle.trim()) {
                addRoutine(newRoutineTime, newRoutineTitle.trim(), newRoutineDays);
                setNewRoutineTitle('');
                setNewRoutineDays([]);
              }
            }}
            disabled={!newRoutineTitle.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={16} />
            루틴 추가
          </button>
        </div>
      </section>

      {/* Data Management */}
      {/* Excel Import */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">엑셀 가져오기</h2>
        <p className="text-sm text-muted-foreground">
          엑셀 파일(.xlsx)의 업무일지 시트를 파싱하여 업무로 추가합니다.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => excelRef.current?.click()}
            disabled={importingExcel}
            className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            <FileSpreadsheet size={18} />
            {importingExcel ? '가져오는 중...' : '엑셀 파일 업로드 (.xlsx)'}
          </button>
          <input
            ref={excelRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImportingExcel(true);
              try {
                const count = await importFromExcel(file);
                await loadTasks();
                setMessage({ type: 'success', text: `엑셀에서 ${count}개 업무를 가져왔습니다.` });
              } catch (err) {
                setMessage({ type: 'error', text: err instanceof Error ? err.message : '엑셀 가져오기 실패' });
              } finally {
                setImportingExcel(false);
                if (excelRef.current) excelRef.current.value = '';
              }
            }}
            className="hidden"
          />
          <button
            onClick={() => setSeedOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
          >
            <Database size={18} />
            샘플 데이터 로드 (기존 데이터 초기화)
          </button>
        </div>
      </section>

      {/* Data Management */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">데이터 관리</h2>
        <div className="space-y-3">
          <button onClick={handleExport} className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent">
            <Download size={18} />
            데이터 내보내기 (JSON)
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={importing} className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50">
            <Upload size={18} />
            {importing ? '가져오는 중...' : '데이터 가져오기 (JSON)'}
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button onClick={() => setClearOpen(true)} className="flex w-full items-center gap-3 rounded-lg border border-red-300 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
            <Trash2 size={18} />
            모든 데이터 삭제
          </button>
        </div>
      </section>

      {/* Info */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">정보</h2>
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground space-y-1">
          <p>Daily Planner v1.1</p>
          <p>모든 데이터는 브라우저 IndexedDB에 저장됩니다.</p>
          <p>데이터 백업을 위해 정기적으로 내보내기를 권장합니다.</p>
        </div>
      </section>

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={handleClear}
        title="모든 데이터 삭제"
        description="정말로 모든 업무와 데일리 로그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="전체 삭제"
        variant="destructive"
      />

      <ConfirmDialog
        open={!!deleteCatId}
        onClose={() => setDeleteCatId(null)}
        onConfirm={() => {
          if (deleteCatId) deleteCategory(deleteCatId);
          setDeleteCatId(null);
        }}
        title="카테고리 삭제"
        description="이 카테고리를 삭제하시겠습니까? 기존 업무의 카테고리는 유지됩니다."
        confirmLabel="삭제"
        variant="destructive"
      />

      <ConfirmDialog
        open={!!deleteRoutineId}
        onClose={() => setDeleteRoutineId(null)}
        onConfirm={() => {
          if (deleteRoutineId) deleteRoutine(deleteRoutineId);
          setDeleteRoutineId(null);
        }}
        title="루틴 삭제"
        description="이 루틴을 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="destructive"
      />

      <ConfirmDialog
        open={seedOpen}
        onClose={() => setSeedOpen(false)}
        onConfirm={async () => {
          try {
            const count = await forceLoadSeedData();
            await loadTasks();
            setMessage({ type: 'success', text: `샘플 데이터 ${count}개를 로드했습니다. (기존 업무 초기화됨)` });
          } catch {
            setMessage({ type: 'error', text: '샘플 데이터 로드에 실패했습니다.' });
          }
          setSeedOpen(false);
        }}
        title="샘플 데이터 로드"
        description="기존 업무를 모두 삭제하고 엑셀 업무일지 샘플 데이터(21개)를 로드합니다. 계속하시겠습니까?"
        confirmLabel="로드"
        variant="destructive"
      />
    </div>
  );
}
