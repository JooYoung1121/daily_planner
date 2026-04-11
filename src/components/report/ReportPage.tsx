import { useState, useMemo, useEffect } from 'react';
import { Copy, Check, RefreshCw, ChevronLeft, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { useTaskStore } from '@/stores/taskStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { PageGuide } from '@/components/common/PageGuide';
import { todayString, formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

const DEFAULT_TEMPLATE = `[오늘 한일]
{completed}

[진행 중]
{in_progress}

[예정]
{upcoming}

[이슈/특이사항]
{notes}`;

export function ReportPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const scheduleItems = useTaskStore((s) => s.scheduleItems);
  const loadSchedule = useTaskStore((s) => s.loadSchedule);
  const savedTemplate = useSettingsStore((s) => s.reportTemplate ?? DEFAULT_TEMPLATE);
  const saveTemplate = useSettingsStore((s) => s.setReportTemplate);

  const [currentDate, setCurrentDate] = useState(todayString());
  const [template, setTemplate] = useState(savedTemplate);
  const [draftTemplate, setDraftTemplate] = useState(savedTemplate);
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Checked items (included in report)
  const [checkedCompleted, setCheckedCompleted] = useState<Set<string>>(new Set());
  const [checkedInProgress, setCheckedInProgress] = useState<Set<string>>(new Set());
  const [checkedUpcoming, setCheckedUpcoming] = useState<Set<string>>(new Set());
  const [checkedSchedule, setCheckedSchedule] = useState<Set<string>>(new Set());

  useEffect(() => { loadSchedule(currentDate); }, [currentDate, loadSchedule]);

  const goPrev = () => setCurrentDate(format(subDays(parseISO(currentDate), 1), 'yyyy-MM-dd'));
  const goNext = () => setCurrentDate(format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd'));
  const goToday = () => setCurrentDate(todayString());

  // Collect data
  const dayCompleted = useMemo(() =>
    tasks.filter((t) => !t.parentId && (t.completedAt?.startsWith(currentDate) || (t.status === 'closed' && t.updatedAt.startsWith(currentDate))))
  , [tasks, currentDate]);

  const dayInProgress = useMemo(() =>
    tasks.filter((t) => !t.parentId && t.status === 'in-progress')
  , [tasks]);

  const dayUpcoming = useMemo(() =>
    tasks.filter((t) => t.status === 'open' && !t.parentId && t.dueDate && t.dueDate > currentDate)
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')).slice(0, 15)
  , [tasks, currentDate]);

  const dayScheduleDone = useMemo(() => scheduleItems.filter((i) => i.done), [scheduleItems]);

  // Auto-check all when data changes
  useEffect(() => {
    setCheckedCompleted(new Set(dayCompleted.map((t) => t.id)));
    setCheckedInProgress(new Set(dayInProgress.map((t) => t.id)));
    setCheckedUpcoming(new Set(dayUpcoming.map((t) => t.id)));
    setCheckedSchedule(new Set(dayScheduleDone.map((s) => s.id)));
  }, [dayCompleted, dayInProgress, dayUpcoming, dayScheduleDone]);

  const toggleCheck = (set: Set<string>, setFn: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setFn(next);
  };

  // Report text (only checked items)
  const reportText = useMemo(() => {
    const completedLines = [
      ...dayCompleted.filter((t) => checkedCompleted.has(t.id)).map((t) => `- ${t.title}${t.category ? ` [${t.category}]` : ''}`),
      ...dayScheduleDone.filter((s) => checkedSchedule.has(s.id)).map((s) => `- ${s.time} ${s.title}`),
    ];
    const inProgressLines = dayInProgress.filter((t) => checkedInProgress.has(t.id)).map((t) => {
      const parts = [`- ${t.title}`];
      if (t.category) parts.push(`[${t.category}]`);
      if (t.dueDate) parts.push(`(~${formatDate(t.dueDate)})`);
      return parts.join(' ');
    });
    const upcomingLines = dayUpcoming.filter((t) => checkedUpcoming.has(t.id)).map((t) =>
      `- ${t.title}${t.dueDate ? ` (~${formatDate(t.dueDate)})` : ''}`
    );
    return template
      .replace('{completed}', completedLines.length > 0 ? completedLines.join('\n') : '- 없음')
      .replace('{in_progress}', inProgressLines.length > 0 ? inProgressLines.join('\n') : '- 없음')
      .replace('{upcoming}', upcomingLines.length > 0 ? upcomingLines.join('\n') : '- 없음')
      .replace('{notes}', notes.trim() || '- 없음')
      .replace('{date}', formatDate(currentDate))
      .replace('{today}', currentDate);
  }, [template, dayCompleted, dayScheduleDone, dayInProgress, dayUpcoming, checkedCompleted, checkedSchedule, checkedInProgress, checkedUpcoming, notes, currentDate]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTemplate = () => {
    setTemplate(draftTemplate);
    saveTemplate(draftTemplate);
    setShowTemplateEditor(false);
  };

  const currentSelected = selectedTask ? tasks.find((t) => t.id === selectedTask.id) ?? null : null;

  return (
    <div className="space-y-6">
      <PageGuide pageId="report" title="일일 보고서 사용법" tips={[
        '체크박스로 보고서에 포함할 업무를 선택/해제할 수 있습니다.',
        '날짜를 변경하면 해당 일의 업무가 자동 수집됩니다.',
        '"복사" 버튼으로 보고서를 메신저에 바로 붙여넣기하세요.',
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">일일 보고서</h1>
          <div className="mt-1 flex items-center gap-2">
            <button onClick={goPrev} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium text-foreground min-w-[100px] text-center">{formatDate(currentDate)}</span>
            <button onClick={goNext} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><ChevronRight size={16} /></button>
            {currentDate !== todayString() && (
              <button onClick={goToday} className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent">오늘</button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setDraftTemplate(template); setShowTemplateEditor(!showTemplateEditor); }} className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
            템플릿 편집
          </button>
          <button onClick={handleCopy} className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            copied ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:opacity-90',
          )}>
            {copied ? <><Check size={16} /> 복사 완료!</> : <><Copy size={16} /> 복사</>}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left: Selectable items */}
        <div className="space-y-4">
          {/* Completed */}
          <ReportSection
            title="오늘 한일"
            color="text-green-500"
            items={dayCompleted}
            checked={checkedCompleted}
            onToggle={(id) => toggleCheck(checkedCompleted, setCheckedCompleted, id)}
            onSelectTask={setSelectedTask}
            renderExtra={(t) => t.category ? `[${t.category}]` : ''}
          />
          {/* Completed schedule */}
          {dayScheduleDone.length > 0 && (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground">완료 스케줄</div>
              {dayScheduleDone.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5 px-4 py-2 hover:bg-accent/30">
                  <button onClick={() => toggleCheck(checkedSchedule, setCheckedSchedule, s.id)} className="shrink-0">
                    {checkedSchedule.has(s.id) ? <CheckSquare size={16} className="text-green-500" /> : <Square size={16} className="text-muted-foreground" />}
                  </button>
                  <span className="text-xs font-mono text-muted-foreground w-12">{s.time}</span>
                  <span className="text-sm">{s.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* In Progress */}
          <ReportSection
            title="진행 중"
            color="text-blue-500"
            items={dayInProgress}
            checked={checkedInProgress}
            onToggle={(id) => toggleCheck(checkedInProgress, setCheckedInProgress, id)}
            onSelectTask={setSelectedTask}
            renderExtra={(t) => [t.category && `[${t.category}]`, t.dueDate && `(~${formatDate(t.dueDate)})`].filter(Boolean).join(' ')}
          />

          {/* Upcoming */}
          <ReportSection
            title="예정"
            color="text-foreground"
            items={dayUpcoming}
            checked={checkedUpcoming}
            onToggle={(id) => toggleCheck(checkedUpcoming, setCheckedUpcoming, id)}
            onSelectTask={setSelectedTask}
            renderExtra={(t) => t.dueDate ? `(~${formatDate(t.dueDate)})` : ''}
          />

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">이슈/특이사항</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="전달할 내용을 입력하세요..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y" />
          </div>

          {/* Template editor */}
          {showTemplateEditor && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">템플릿 편집</label>
                <button onClick={() => setDraftTemplate(DEFAULT_TEMPLATE)} className="text-xs text-muted-foreground hover:text-primary"><RefreshCw size={12} className="inline mr-1" />기본값</button>
              </div>
              <textarea value={draftTemplate} onChange={(e) => setDraftTemplate(e.target.value)} rows={8} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y" />
              <p className="text-[10px] text-muted-foreground">변수: {'{completed}'} {'{in_progress}'} {'{upcoming}'} {'{notes}'} {'{date}'}</p>
              <div className="flex gap-2">
                <button onClick={handleSaveTemplate} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">저장</button>
                <button onClick={() => setShowTemplateEditor(false)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">취소</button>
              </div>
            </div>
          )}

          {!showTemplateEditor && (
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">빠른 템플릿</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '기본', value: DEFAULT_TEMPLATE },
                  { label: '간단', value: `${'{date}'} 업무 보고\n\n- 완료:\n{completed}\n\n- 진행중:\n{in_progress}` },
                  { label: '상세', value: `[${'{date}'} 일일 업무 보고]\n\n1. 금일 수행 업무\n{completed}\n\n2. 진행 중 업무\n{in_progress}\n\n3. 차주 예정 업무\n{upcoming}\n\n4. 이슈 및 건의사항\n{notes}\n\n이상입니다. 감사합니다.` },
                ].map((p) => (
                  <button key={p.label} onClick={() => { setTemplate(p.value); saveTemplate(p.value); }} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground">{p.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview (always visible) */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">미리보기</label>
            <button onClick={handleCopy} className="text-xs text-primary hover:underline">{copied ? '복사 완료!' : '클립보드에 복사'}</button>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 min-h-[300px] max-h-[calc(100vh-200px)] overflow-y-auto">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{reportText}</pre>
          </div>
        </div>
      </div>

      {currentSelected && (
        <TaskDetailPanel task={currentSelected} onClose={() => setSelectedTask(null)} onEdit={() => setSelectedTask(null)} onDelete={() => setSelectedTask(null)} onSelectTask={(t) => setSelectedTask(t)} />
      )}
    </div>
  );
}

/* --- Report Section with checkboxes --- */
function ReportSection({ title, color, items, checked, onToggle, onSelectTask, renderExtra }: {
  title: string;
  color: string;
  items: Task[];
  checked: Set<string>;
  onToggle: (id: string) => void;
  onSelectTask: (t: Task) => void;
  renderExtra: (t: Task) => string;
}) {
  const allChecked = items.length > 0 && items.every((t) => checked.has(t.id));
  const toggleAll = () => {
    if (allChecked) {
      // uncheck all
      items.forEach((t) => { if (checked.has(t.id)) onToggle(t.id); });
    } else {
      // check all
      items.forEach((t) => { if (!checked.has(t.id)) onToggle(t.id); });
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
        <button onClick={toggleAll} className="shrink-0">
          {allChecked ? <CheckSquare size={14} className="text-primary" /> : <Square size={14} className="text-muted-foreground" />}
        </button>
        <span className={cn('text-xs font-semibold', color)}>{title}</span>
        <span className="text-[10px] text-muted-foreground">({items.filter((t) => checked.has(t.id)).length}/{items.length})</span>
      </div>
      <div className="divide-y divide-border">
        {items.map((task) => (
          <div key={task.id} className="flex items-center gap-2.5 px-4 py-2 hover:bg-accent/30 transition-colors">
            <button onClick={() => onToggle(task.id)} className="shrink-0">
              {checked.has(task.id) ? <CheckSquare size={16} className="text-green-500" /> : <Square size={16} className="text-muted-foreground" />}
            </button>
            <button onClick={() => onSelectTask(task)} className="flex-1 text-left text-sm truncate hover:text-primary transition-colors">
              {task.title}
            </button>
            <span className="text-[10px] text-muted-foreground shrink-0">{renderExtra(task)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
