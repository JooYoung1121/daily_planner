import { useState, useMemo, useEffect } from 'react';
import { Copy, Check, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const [expandedStat, setExpandedStat] = useState<'completed' | 'in_progress' | 'upcoming' | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Load schedule for selected date
  useEffect(() => { loadSchedule(currentDate); }, [currentDate, loadSchedule]);

  // Date nav
  const goPrev = () => setCurrentDate(format(subDays(parseISO(currentDate), 1), 'yyyy-MM-dd'));
  const goNext = () => setCurrentDate(format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd'));
  const goToday = () => setCurrentDate(todayString());

  // Collect data for selected date
  const dayCompleted = useMemo(() =>
    tasks.filter((t) =>
      !t.parentId && (
        t.completedAt?.startsWith(currentDate) ||
        (t.status === 'closed' && t.updatedAt.startsWith(currentDate))
      )
    )
  , [tasks, currentDate]);

  const dayInProgress = useMemo(() =>
    tasks.filter((t) => !t.parentId && t.status === 'in-progress' && (
      !t.dueDate || t.dueDate <= currentDate || t.createdAt.startsWith(currentDate) || t.updatedAt.startsWith(currentDate)
    ))
  , [tasks, currentDate]);

  const dayUpcoming = useMemo(() =>
    tasks.filter((t) => t.status === 'open' && !t.parentId && t.dueDate && t.dueDate > currentDate)
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
      .slice(0, 10)
  , [tasks, currentDate]);

  const dayScheduleDone = useMemo(() => scheduleItems.filter((i) => i.done), [scheduleItems]);

  // Report text
  const reportText = useMemo(() => {
    const completedLines = [
      ...dayCompleted.map((t) => `- ${t.title}${t.category ? ` [${t.category}]` : ''}`),
      ...dayScheduleDone.map((s) => `- ${s.time} ${s.title}`),
    ];
    const inProgressLines = dayInProgress.map((t) => {
      const parts = [`- ${t.title}`];
      if (t.category) parts.push(`[${t.category}]`);
      if (t.dueDate) parts.push(`(~${formatDate(t.dueDate)})`);
      return parts.join(' ');
    });
    const upcomingLines = dayUpcoming.map((t) =>
      `- ${t.title}${t.dueDate ? ` (~${formatDate(t.dueDate)})` : ''}`
    );
    return template
      .replace('{completed}', completedLines.length > 0 ? completedLines.join('\n') : '- 없음')
      .replace('{in_progress}', inProgressLines.length > 0 ? inProgressLines.join('\n') : '- 없음')
      .replace('{upcoming}', upcomingLines.length > 0 ? upcomingLines.join('\n') : '- 없음')
      .replace('{notes}', notes.trim() || '- 없음')
      .replace('{date}', formatDate(currentDate))
      .replace('{today}', currentDate);
  }, [template, dayCompleted, dayScheduleDone, dayInProgress, dayUpcoming, notes, currentDate]);

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

  const handleCancelTemplate = () => {
    setDraftTemplate(template);
    setShowTemplateEditor(false);
  };

  const statItems = expandedStat === 'completed' ? dayCompleted :
    expandedStat === 'in_progress' ? dayInProgress :
    expandedStat === 'upcoming' ? dayUpcoming : [];

  const currentSelected = selectedTask ? tasks.find((t) => t.id === selectedTask.id) ?? null : null;

  return (
    <div className="space-y-6">
      <PageGuide pageId="report" title="일일 보고서 사용법" tips={[
        '날짜를 변경하면 해당 일의 완료/진행중/예정 업무가 자동 수집됩니다.',
        '숫자 카드를 클릭하면 해당 업무 목록이 펼쳐지고, 업무를 클릭하면 상세를 볼 수 있습니다.',
        '"템플릿 편집" → 수정 → "저장"으로 보고서 형식을 커스텀하세요. 저장하면 다음에도 유지됩니다.',
        '"복사" 버튼으로 보고서를 클립보드에 복사하여 메신저에 붙여넣기하세요.',
      ]} />

      {/* Header + Date nav */}
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
          <button
            onClick={() => { setDraftTemplate(template); setShowTemplateEditor(!showTemplateEditor); }}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
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

      {/* Stats - clickable */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { key: 'completed' as const, label: '완료', count: dayCompleted.length + dayScheduleDone.length, color: 'text-green-500', hoverBorder: 'hover:border-green-300' },
          { key: 'in_progress' as const, label: '진행 중', count: dayInProgress.length, color: 'text-blue-500', hoverBorder: 'hover:border-blue-300' },
          { key: 'upcoming' as const, label: '예정', count: dayUpcoming.length, color: 'text-foreground', hoverBorder: 'hover:border-primary/30' },
        ]).map((stat) => (
          <button
            key={stat.key}
            onClick={() => setExpandedStat(expandedStat === stat.key ? null : stat.key)}
            className={cn(
              'rounded-lg border bg-card p-3 text-center transition-all cursor-pointer',
              expandedStat === stat.key ? 'border-primary shadow-md' : 'border-border ' + stat.hoverBorder,
            )}
          >
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.count}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Expanded stat list */}
      {expandedStat && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
            <span className="text-sm font-semibold text-foreground">
              {expandedStat === 'completed' ? '완료된 업무' : expandedStat === 'in_progress' ? '진행 중 업무' : '예정 업무'}
            </span>
            <button onClick={() => setExpandedStat(null)} className="rounded p-0.5 text-muted-foreground hover:bg-accent"><X size={14} /></button>
          </div>
          {statItems.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground text-center">업무가 없습니다</p>
          ) : (
            <div className="divide-y divide-border">
              {statItems.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/30 transition-colors"
                >
                  <span className={cn(
                    'shrink-0 w-2 h-2 rounded-full',
                    task.status === 'closed' ? 'bg-green-500' : task.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-400',
                  )} />
                  <span className="flex-1 text-sm truncate">{task.title}</span>
                  {task.category && <span className="text-[10px] text-muted-foreground">{task.category}</span>}
                  {task.dueDate && <span className="text-[10px] text-muted-foreground">{formatDate(task.dueDate)}</span>}
                </button>
              ))}
            </div>
          )}
          {expandedStat === 'completed' && dayScheduleDone.length > 0 && (
            <>
              <div className="px-4 py-1.5 bg-muted/20 text-[10px] text-muted-foreground font-medium">스케줄</div>
              <div className="divide-y divide-border">
                {dayScheduleDone.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-mono text-xs w-12">{s.time}</span>
                    <span className="line-through">{s.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">이슈/특이사항</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="오늘 특이사항이나 전달할 내용을 입력하세요..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y" />
          </div>

          {/* Template editor */}
          {showTemplateEditor && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">템플릿 편집</label>
                <button onClick={() => setDraftTemplate(DEFAULT_TEMPLATE)} className="text-xs text-muted-foreground hover:text-primary">
                  <RefreshCw size={12} className="inline mr-1" />기본값 복원
                </button>
              </div>
              <textarea value={draftTemplate} onChange={(e) => setDraftTemplate(e.target.value)} rows={10} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y" />
              <p className="text-[10px] text-muted-foreground">
                변수: {'{completed}'} {'{in_progress}'} {'{upcoming}'} {'{notes}'} {'{date}'} {'{today}'}
              </p>
              <div className="flex gap-2">
                <button onClick={handleSaveTemplate} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">저장</button>
                <button onClick={handleCancelTemplate} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">취소</button>
              </div>
            </div>
          )}

          {/* Template presets */}
          {!showTemplateEditor && (
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">빠른 템플릿</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '기본', value: DEFAULT_TEMPLATE },
                  { label: '간단', value: `${'{date}'} 업무 보고\n\n- 완료: {completed}\n- 진행중: {in_progress}` },
                  { label: '상세', value: `[${'{date}'} 일일 업무 보고]\n\n1. 금일 수행 업무\n{completed}\n\n2. 진행 중 업무\n{in_progress}\n\n3. 차주 예정 업무\n{upcoming}\n\n4. 이슈 및 건의사항\n{notes}\n\n이상입니다. 감사합니다.` },
                ].map((preset) => (
                  <button key={preset.label} onClick={() => { setTemplate(preset.value); saveTemplate(preset.value); }} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">미리보기</label>
            <button onClick={handleCopy} className="text-xs text-primary hover:underline">
              {copied ? '복사 완료!' : '클립보드에 복사'}
            </button>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 min-h-[300px]">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{reportText}</pre>
          </div>
        </div>
      </div>

      {/* Task detail panel */}
      {currentSelected && (
        <TaskDetailPanel
          task={currentSelected}
          onClose={() => setSelectedTask(null)}
          onEdit={() => setSelectedTask(null)}
          onDelete={() => setSelectedTask(null)}
          onSelectTask={(t) => setSelectedTask(t)}
        />
      )}
    </div>
  );
}
