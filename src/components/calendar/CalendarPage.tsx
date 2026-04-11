import { useState, useMemo, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTaskStore } from '@/stores/taskStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { TaskFormDialog, type TaskFormData } from '@/components/tasks/TaskFormDialog';
import { TaskCard } from '@/components/tasks/TaskCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toDateString, todayString } from '@/lib/date';
import type { Task } from '@/types/task';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { ko },
});

const messages = {
  today: '오늘',
  previous: '이전',
  next: '다음',
  month: '월',
  week: '주',
  day: '일',
  agenda: '목록',
  date: '날짜',
  time: '시간',
  event: '일정',
  noEventsInRange: '해당 기간에 일정이 없습니다.',
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Task;
}

export function CalendarPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const currentDate = useCalendarStore((s) => s.currentDate);
  const setCurrentDate = useCalendarStore((s) => s.setCurrentDate);
  const view = useCalendarStore((s) => s.view);
  const setView = useCalendarStore((s) => s.setView);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayString());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const events: CalendarEvent[] = useMemo(
    () =>
      tasks
        .filter((t) => t.dueDate)
        .map((t) => {
          const dateStr = t.dueDate!;
          const timeStr = t.dueTime ?? '09:00';
          const start = new Date(`${dateStr}T${timeStr}`);
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          return { id: t.id, title: t.title, start, end, resource: t };
        }),
    [tasks],
  );

  const handleSelectSlot = useCallback(
    ({ start }: { start: Date }) => {
      setSelectedDate(toDateString(start));
      setEditingTask(null);
      setFormOpen(true);
    },
    [],
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedTask(event.resource);
  }, []);

  const handleSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await addTask({ ...data, parentId: null, subtasks: [], recurrence: data.recurrence ?? null, recurrenceSourceId: null });
    }
    setEditingTask(null);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const task = event.resource;
    const isDone = task.status === 'closed';
    return {
      style: {
        backgroundColor: isDone
          ? 'rgba(34, 197, 94, 0.2)'
          : task.priority === 'high'
            ? 'rgba(239, 68, 68, 0.2)'
            : task.priority === 'medium'
              ? 'rgba(234, 179, 8, 0.2)'
              : 'rgba(148, 163, 184, 0.2)',
        color: 'inherit',
        border: 'none',
        borderLeft: `3px solid ${
          isDone ? '#22c55e' : task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#eab308' : '#94a3b8'
        }`,
        borderRadius: '4px',
        opacity: isDone ? 0.6 : 1,
        fontSize: '12px',
        padding: '2px 4px',
      },
    };
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">캘린더</h1>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          view={view as View}
          onNavigate={setCurrentDate}
          onView={(v) => setView(v as typeof view)}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          style={{ height: 'calc(100vh - 240px)' }}
          messages={messages}
          culture="ko"
          eventPropGetter={eventStyleGetter}
          components={{
            event: ({ event }: { event: CalendarEvent }) => {
              const t = event.resource;
              return (
                <div className="flex items-center gap-1 overflow-hidden">
                  {t.priority === 'high' && <span className="shrink-0 text-[8px]">🔴</span>}
                  <span className="truncate text-[11px] font-medium">{event.title}</span>
                  {t.tags.length > 0 && (
                    <span className="shrink-0 truncate text-[9px] opacity-70">
                      #{t.tags[0]}
                    </span>
                  )}
                </div>
              );
            },
          }}
        />
      </div>

      {/* Task detail side panel */}
      {selectedTask && (
        <div className="fixed inset-y-0 right-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setSelectedTask(null)}
          />
          <div className="relative ml-auto h-full w-96 border-l border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">업무 상세</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <TaskCard task={selectedTask} />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setEditingTask(selectedTask);
                  setFormOpen(true);
                  setSelectedTask(null);
                }}
                className="flex-1 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                수정
              </button>
              <button
                onClick={() => {
                  setDeleteId(selectedTask.id);
                  setSelectedTask(null);
                }}
                className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      <TaskFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmit}
        task={editingTask}
        defaultDate={selectedDate}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) await deleteTask(deleteId);
          setDeleteId(null);
        }}
        title="업무 삭제"
        description="이 업무를 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="destructive"
      />
    </div>
  );
}
