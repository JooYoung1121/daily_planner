import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Smile, Meh, Frown, SmilePlus } from 'lucide-react';
import { useDailyLogStore } from '@/stores/dailyLogStore';
import { useTaskStore } from '@/stores/taskStore';
import { useDebounce } from '@/hooks/useDebounce';
import { TaskCard } from '@/components/tasks/TaskCard';
import { todayString, formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Mood } from '@/types/dailyLog';
import { format, addDays, subDays, parseISO } from 'date-fns';

const MOOD_OPTIONS: { value: Mood; icon: typeof Smile; label: string }[] = [
  { value: 'great', icon: SmilePlus, label: '최고' },
  { value: 'good', icon: Smile, label: '좋음' },
  { value: 'okay', icon: Meh, label: '보통' },
  { value: 'bad', icon: Frown, label: '별로' },
];

export function DailyLogPage() {
  const entries = useDailyLogStore((s) => s.entries);
  const getEntryByDate = useDailyLogStore((s) => s.getEntryByDate);
  const saveEntry = useDailyLogStore((s) => s.saveEntry);
  const tasks = useTaskStore((s) => s.tasks);

  const [currentDate, setCurrentDate] = useState(todayString());
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood | undefined>();
  const [saved, setSaved] = useState(true);

  const entry = getEntryByDate(currentDate);
  const dayTasks = tasks.filter((t) => t.dueDate === currentDate);
  const completedTasks = dayTasks.filter((t) => t.status === 'done');

  // Load entry when date changes
  useEffect(() => {
    if (entry) {
      setContent(entry.content);
      setMood(entry.mood);
    } else {
      setContent('');
      setMood(undefined);
    }
    setSaved(true);
  }, [currentDate, entry?.id]);

  // Auto-save with debounce
  useDebounce(
    () => {
      if (!saved && content.trim()) {
        saveEntry(currentDate, content, mood);
        setSaved(true);
      }
    },
    800,
    [content, mood, saved],
  );

  const goToday = () => setCurrentDate(todayString());
  const goPrev = () => setCurrentDate(format(subDays(parseISO(currentDate), 1), 'yyyy-MM-dd'));
  const goNext = () => setCurrentDate(format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd'));

  // Recent entries for sidebar
  const recentEntries = entries.slice(0, 20);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">데일리 로그</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main Editor */}
        <div className="space-y-4">
          {/* Date navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-foreground">
              {formatDate(currentDate)}
            </h2>
            <button
              onClick={goNext}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            >
              <ChevronRight size={20} />
            </button>
            {currentDate !== todayString() && (
              <button
                onClick={goToday}
                className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
              >
                오늘
              </button>
            )}
            {!saved && (
              <span className="text-xs text-muted-foreground">저장 중...</span>
            )}
          </div>

          {/* Mood selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">오늘의 기분:</span>
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setMood(opt.value);
                  setSaved(false);
                }}
                className={cn(
                  'rounded-md p-1.5 transition-colors',
                  mood === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent',
                )}
                title={opt.label}
              >
                <opt.icon size={20} />
              </button>
            ))}
          </div>

          {/* Editor */}
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setSaved(false);
            }}
            placeholder="오늘 하루를 기록하세요..."
            className="min-h-[300px] w-full rounded-lg border border-input bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />

          {/* Today's tasks */}
          {dayTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                이 날의 업무 ({completedTasks.length}/{dayTasks.length} 완료)
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                {dayTasks.map((task) => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Recent entries */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-card-foreground">
            최근 기록
          </h3>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 기록이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setCurrentDate(e.date)}
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                    e.date === currentDate
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent',
                  )}
                >
                  <span className="font-medium">{formatDate(e.date)}</span>
                  <p className="mt-0.5 truncate text-xs opacity-70">
                    {e.content.slice(0, 50)}
                    {e.content.length > 50 ? '...' : ''}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
