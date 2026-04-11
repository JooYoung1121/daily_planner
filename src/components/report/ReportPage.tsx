import { useState, useMemo } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { PageGuide } from '@/components/common/PageGuide';
import { todayString, formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';

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

  const today = todayString();
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // Collect today's data
  const todayCompleted = useMemo(() =>
    tasks.filter((t) => t.completedAt?.startsWith(today) || (t.status === 'closed' && t.updatedAt.startsWith(today)))
  , [tasks, today]);

  const inProgress = useMemo(() =>
    tasks.filter((t) => t.status === 'in-progress' && !t.parentId)
  , [tasks]);

  const upcoming = useMemo(() =>
    tasks.filter((t) => t.status === 'open' && !t.parentId && t.dueDate && t.dueDate > today)
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
      .slice(0, 10)
  , [tasks, today]);

  const completedSchedule = useMemo(() =>
    scheduleItems.filter((i) => i.done)
  , [scheduleItems]);

  // Generate report text
  const reportText = useMemo(() => {
    const completedLines = [
      ...todayCompleted.map((t) => `- ${t.title}${t.category ? ` [${t.category}]` : ''}`),
      ...completedSchedule.map((s) => `- ${s.time} ${s.title}`),
    ];

    const inProgressLines = inProgress.map((t) => {
      const parts = [`- ${t.title}`];
      if (t.category) parts.push(`[${t.category}]`);
      if (t.dueDate) parts.push(`(~${formatDate(t.dueDate)})`);
      return parts.join(' ');
    });

    const upcomingLines = upcoming.map((t) => {
      return `- ${t.title}${t.dueDate ? ` (~${formatDate(t.dueDate)})` : ''}`;
    });

    return template
      .replace('{completed}', completedLines.length > 0 ? completedLines.join('\n') : '- 없음')
      .replace('{in_progress}', inProgressLines.length > 0 ? inProgressLines.join('\n') : '- 없음')
      .replace('{upcoming}', upcomingLines.length > 0 ? upcomingLines.join('\n') : '- 없음')
      .replace('{notes}', notes.trim() || '- 없음')
      .replace('{date}', formatDate(today))
      .replace('{today}', today);
  }, [template, todayCompleted, completedSchedule, inProgress, upcoming, notes, today]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageGuide pageId="report" title="일일 보고서 사용법" tips={[
        '오늘 완료한 업무와 진행 중/예정 업무가 자동으로 수집됩니다.',
        '"복사" 버튼을 누르면 보고서가 클립보드에 복사됩니다. 메신저에 바로 붙여넣기하세요.',
        '"템플릿 편집"에서 보고서 형식을 자유롭게 커스텀할 수 있습니다.',
        '{completed} {in_progress} {upcoming} {notes} {date} 변수를 사용하세요.',
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">일일 보고서</h1>
          <p className="text-sm text-muted-foreground">{formatDate(today)} 업무 보고</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplateEditor(!showTemplateEditor)}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            템플릿 편집
          </button>
          <button
            onClick={handleCopy}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              copied
                ? 'bg-green-500 text-white'
                : 'bg-primary text-primary-foreground hover:opacity-90',
            )}
          >
            {copied ? <><Check size={16} /> 복사 완료!</> : <><Copy size={16} /> 복사</>}
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{todayCompleted.length + completedSchedule.length}</p>
          <p className="text-xs text-muted-foreground">오늘 완료</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-blue-500">{inProgress.length}</p>
          <p className="text-xs text-muted-foreground">진행 중</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{upcoming.length}</p>
          <p className="text-xs text-muted-foreground">예정</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Notes + Template */}
        <div className="space-y-4">
          {/* Notes input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">이슈/특이사항</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="오늘 특이사항이나 전달할 내용을 입력하세요..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
          </div>

          {/* Template editor */}
          {showTemplateEditor && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">템플릿 형식</label>
                <button onClick={() => setTemplate(DEFAULT_TEMPLATE)} className="text-xs text-muted-foreground hover:text-primary">
                  <RefreshCw size={12} className="inline mr-1" />기본값 복원
                </button>
              </div>
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={10}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                사용 가능 변수: {'{completed}'} {'{in_progress}'} {'{upcoming}'} {'{notes}'} {'{date}'} {'{today}'}
              </p>
            </div>
          )}

          {/* Template presets */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">빠른 템플릿</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '기본', value: DEFAULT_TEMPLATE },
                { label: '간단', value: `${'{date}'} 업무 보고\n\n- 완료: {completed}\n- 진행중: {in_progress}` },
                { label: '상세', value: `[${'{date}'} 일일 업무 보고]\n\n1. 금일 수행 업무\n{completed}\n\n2. 진행 중 업무\n{in_progress}\n\n3. 차주 예정 업무\n{upcoming}\n\n4. 이슈 및 건의사항\n{notes}\n\n이상입니다. 감사합니다.` },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setTemplate(preset.value)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">미리보기</label>
            <button
              onClick={handleCopy}
              className="text-xs text-primary hover:underline"
            >
              {copied ? '복사 완료!' : '클립보드에 복사'}
            </button>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 min-h-[300px]">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{reportText}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
