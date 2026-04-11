import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTaskStore } from '@/stores/taskStore';
import { format, subDays, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

const STATUS_COLORS_CHART = {
  open: '#94a3b8',
  'in-progress': '#3b82f6',
  closed: '#22c55e',
};

const PRIORITY_COLORS_CHART = {
  high: '#ef4444',
  medium: '#eab308',
  low: '#94a3b8',
};

export function StatsPage() {
  const tasks = useTaskStore((s) => s.tasks);

  const statusData = useMemo(() => {
    const counts = { open: 0, 'in-progress': 0, closed: 0 };
    tasks.forEach((t) => { if (counts[t.status] !== undefined) counts[t.status]++; });
    return [
      { name: 'Open', value: counts.open, color: STATUS_COLORS_CHART.open },
      { name: 'In Progress', value: counts['in-progress'], color: STATUS_COLORS_CHART['in-progress'] },
      { name: 'Closed', value: counts.closed, color: STATUS_COLORS_CHART.closed },
    ];
  }, [tasks]);

  const priorityData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    tasks.forEach((t) => counts[t.priority]++);
    return [
      { name: '높음', value: counts.high, color: PRIORITY_COLORS_CHART.high },
      { name: '보통', value: counts.medium, color: PRIORITY_COLORS_CHART.medium },
      { name: '낮음', value: counts.low, color: PRIORITY_COLORS_CHART.low },
    ];
  }, [tasks]);

  const dailyCompletionData = useMemo(() => {
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const date = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
      const label = format(subDays(new Date(), 13 - i), 'M/d', { locale: ko });
      const created = tasks.filter(
        (t) => t.createdAt.startsWith(date),
      ).length;
      const completed = tasks.filter(
        (t) => t.completedAt && t.completedAt.startsWith(date),
      ).length;
      return { date: label, created, completed };
    });
    return last14;
  }, [tasks]);

  const completionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter((t) => t.status === 'closed').length / tasks.length) * 100);
  }, [tasks]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      const cat = t.category || '미분류';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [tasks]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">통계</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard label="전체 업무" value={tasks.length} />
        <SummaryCard label="완료율" value={`${completionRate}%`} />
        <SummaryCard
          label="이번 주 생성"
          value={
            tasks.filter((t) => {
              const d = parseISO(t.createdAt);
              return d >= subDays(new Date(), 7);
            }).length
          }
        />
        <SummaryCard
          label="이번 주 완료"
          value={
            tasks.filter((t) => {
              if (!t.completedAt) return false;
              return parseISO(t.completedAt) >= subDays(new Date(), 7);
            }).length
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Pie */}
        <ChartCard title="상태별 분포">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Priority Pie */}
        <ChartCard title="우선순위별 분포">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Daily trend */}
        <ChartCard title="최근 14일 추이" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyCompletionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="created" name="생성" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="완료" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category bar */}
        {categoryData.length > 0 && (
          <ChartCard title="카테고리별 업무" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                <Tooltip />
                <Bar dataKey="value" name="업무 수" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 shadow-sm ${className ?? ''}`}>
      <h3 className="mb-3 text-sm font-semibold text-card-foreground">{title}</h3>
      {children}
    </div>
  );
}
