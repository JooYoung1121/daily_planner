import { useState, useRef } from 'react';
import { Download, Upload, Trash2, Moon, Sun, Monitor } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTaskStore } from '@/stores/taskStore';
import { useDailyLogStore } from '@/stores/dailyLogStore';
import { exportAllData, importAllData, clearAllData, downloadJson } from '@/lib/export';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { cn } from '@/lib/utils';
import type { Theme } from '@/types/settings';

const THEMES: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: '라이트' },
  { value: 'dark', icon: Moon, label: '다크' },
  { value: 'system', icon: Monitor, label: '시스템' },
];

export function SettingsPage() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadEntries = useDailyLogStore((s) => s.loadEntries);

  const [clearOpen, setClearOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    } catch (err) {
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

      {/* Data Management */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">데이터 관리</h2>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
          >
            <Download size={18} />
            데이터 내보내기 (JSON)
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            <Upload size={18} />
            {importing ? '가져오는 중...' : '데이터 가져오기 (JSON)'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          <button
            onClick={() => setClearOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg border border-red-300 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 size={18} />
            모든 데이터 삭제
          </button>
        </div>
      </section>

      {/* Info */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">정보</h2>
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground space-y-1">
          <p>Daily Planner v1.0</p>
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
    </div>
  );
}
