import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useTaskStore } from '@/stores/taskStore';
import { useDailyLogStore } from '@/stores/dailyLogStore';
import { useMilestoneStore } from '@/stores/milestoneStore';
import { seedData } from '@/lib/seed';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { TodayPage } from '@/components/today/TodayPage';
import { CalendarPage } from '@/components/calendar/CalendarPage';
import { WeeklyPage } from '@/components/weekly/WeeklyPage';
import { KanbanPage } from '@/components/kanban/KanbanPage';
import { MilestonePage } from '@/components/milestone/MilestonePage';
import { LibraryPage } from '@/components/library/LibraryPage';
import { StatsPage } from '@/components/stats/StatsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { CustomPage } from '@/components/custom/CustomPage';

export default function App() {
  useTheme();

  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadEntries = useDailyLogStore((s) => s.loadEntries);
  const loadMilestones = useMilestoneStore((s) => s.loadMilestones);

  useEffect(() => {
    (async () => {
      const seeded = await seedData();
      await Promise.all([loadTasks(), loadEntries(), loadMilestones()]);
      if (seeded) console.log('Seed data loaded');
    })();
  }, [loadTasks, loadEntries, loadMilestones]);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/weekly" element={<WeeklyPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/kanban" element={<KanbanPage />} />
        <Route path="/milestone" element={<MilestonePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/custom/:id" element={<CustomPage />} />
      </Route>
    </Routes>
  );
}
