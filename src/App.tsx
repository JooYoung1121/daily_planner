import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useTaskStore } from '@/stores/taskStore';
import { useDailyLogStore } from '@/stores/dailyLogStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { TodayPage } from '@/components/today/TodayPage';
import { CalendarPage } from '@/components/calendar/CalendarPage';
import { KanbanPage } from '@/components/kanban/KanbanPage';
import { DailyLogPage } from '@/components/daily-log/DailyLogPage';
import { StatsPage } from '@/components/stats/StatsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';

export default function App() {
  useTheme();

  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadEntries = useDailyLogStore((s) => s.loadEntries);

  useEffect(() => {
    loadTasks();
    loadEntries();
  }, [loadTasks, loadEntries]);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/kanban" element={<KanbanPage />} />
        <Route path="/daily-log" element={<DailyLogPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
