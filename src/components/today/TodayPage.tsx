import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  CheckSquare,
  Square,
  Trash2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Timer,
} from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { todayString, formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';


export function TodayPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const scheduleItems = useTaskStore((s) => s.scheduleItems);
  const loadSchedule = useTaskStore((s) => s.loadSchedule);
  const addScheduleItem = useTaskStore((s) => s.addScheduleItem);
  const toggleScheduleItem = useTaskStore((s) => s.toggleScheduleItem);
  const deleteScheduleItem = useTaskStore((s) => s.deleteScheduleItem);

  const today = todayString();
  const [newTime, setNewTime] = useState('09:00');
  const [newTitle, setNewTitle] = useState('');

  // Pomodoro state
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);

  useEffect(() => {
    loadSchedule(today);
  }, [today, loadSchedule]);

  // Pomodoro timer
  useEffect(() => {
    if (!pomodoroRunning) return;
    const interval = setInterval(() => {
      setPomodoroSeconds((prev) => {
        if (prev === 0) {
          if (pomodoroMinutes === 0) {
            // Timer done
            setPomodoroRunning(false);
            if (pomodoroMode === 'work') {
              setPomodoroCount((c) => c + 1);
              setPomodoroMode('break');
              setPomodoroMinutes(5);
              setPomodoroSeconds(0);
            } else {
              setPomodoroMode('work');
              setPomodoroMinutes(25);
              setPomodoroSeconds(0);
            }
            return 0;
          }
          setPomodoroMinutes((m) => m - 1);
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroMinutes, pomodoroMode]);

  const resetPomodoro = () => {
    setPomodoroRunning(false);
    setPomodoroMode('work');
    setPomodoroMinutes(25);
    setPomodoroSeconds(0);
  };

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.dueDate === today && !t.parentId).sort((a, b) => (a.dueTime ?? '').localeCompare(b.dueTime ?? '')),
    [tasks, today],
  );

  const handleAddScheduleItem = () => {
    if (!newTitle.trim()) return;
    addScheduleItem({ time: newTime, title: newTitle.trim(), done: false, taskId: null, date: today });
    setNewTitle('');
  };

  const completedSchedule = scheduleItems.filter((i) => i.done).length;
  const totalSchedule = scheduleItems.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">오늘의 할일</h1>
          <p className="text-sm text-muted-foreground">{formatDate(today)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Schedule */}
        <div className="space-y-4">
          {/* Progress */}
          {totalSchedule > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">오늘 진행률</span>
                <span className="text-sm text-muted-foreground">{completedSchedule}/{totalSchedule}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${totalSchedule ? (completedSchedule / totalSchedule) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Add item */}
          <div className="flex gap-2">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddScheduleItem()}
              placeholder="할 일을 입력하세요..."
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleAddScheduleItem}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus size={16} />
              추가
            </button>
          </div>

          {/* Schedule list */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {scheduleItems.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                오늘의 스케줄을 추가하세요
              </p>
            ) : (
              <div className="divide-y divide-border">
                {scheduleItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'group flex items-center gap-3 px-4 py-3 transition-colors',
                      item.done && 'bg-muted/30',
                    )}
                  >
                    <button onClick={() => toggleScheduleItem(item.id)} className="shrink-0">
                      {item.done
                        ? <CheckSquare size={18} className="text-green-500" />
                        : <Square size={18} className="text-muted-foreground hover:text-primary" />}
                    </button>
                    <span className="text-sm font-mono text-muted-foreground w-14 shrink-0">{item.time}</span>
                    <span className={cn('flex-1 text-sm', item.done && 'line-through text-muted-foreground')}>
                      {item.title}
                    </span>
                    <button
                      onClick={() => deleteScheduleItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's tasks from task store */}
          {todayTasks.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock size={14} />
                오늘 마감 업무
              </h3>
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <span className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      task.status === 'closed' ? 'bg-green-500' : task.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-400',
                    )} />
                    <span className={cn('flex-1', task.status === 'closed' && 'line-through text-muted-foreground')}>
                      {task.title}
                    </span>
                    {task.dueTime && <span className="text-xs text-muted-foreground font-mono">{task.dueTime}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Pomodoro Timer */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Timer size={20} className={pomodoroMode === 'work' ? 'text-red-500' : 'text-green-500'} />
              <h3 className="text-sm font-semibold text-foreground">
                {pomodoroMode === 'work' ? '집중 시간' : '휴식 시간'}
              </h3>
            </div>

            {/* Timer display */}
            <div className="text-5xl font-bold font-mono text-foreground mb-6">
              {String(pomodoroMinutes).padStart(2, '0')}:{String(pomodoroSeconds).padStart(2, '0')}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPomodoroRunning(!pomodoroRunning)}
                className={cn(
                  'rounded-full p-3 text-white transition-colors',
                  pomodoroRunning ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600',
                )}
              >
                {pomodoroRunning ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={resetPomodoro}
                className="rounded-full p-3 border border-border text-muted-foreground hover:bg-accent"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            {/* Pomodoro count */}
            <div className="mt-4 flex items-center justify-center gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-3 h-3 rounded-full border-2',
                    i < pomodoroCount % 4
                      ? 'border-red-500 bg-red-500'
                      : 'border-muted-foreground/30',
                  )}
                />
              ))}
              <span className="ml-2 text-xs text-muted-foreground">{pomodoroCount}회 완료</span>
            </div>

            {/* Quick settings */}
            <div className="mt-4 flex justify-center gap-2">
              {[15, 25, 45].map((m) => (
                <button
                  key={m}
                  onClick={() => { setPomodoroMinutes(m); setPomodoroSeconds(0); setPomodoroRunning(false); setPomodoroMode('work'); }}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium border',
                    !pomodoroRunning && pomodoroMinutes === m && pomodoroMode === 'work'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-accent',
                  )}
                >
                  {m}분
                </button>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">오늘 현황</h3>
            <div className="text-sm text-muted-foreground">
              <p>스케줄: {completedSchedule}/{totalSchedule} 완료</p>
              <p>마감 업무: {todayTasks.filter((t) => t.status === 'closed').length}/{todayTasks.length} 완료</p>
              <p>포모도로: {pomodoroCount}회</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
