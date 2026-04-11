import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Kanban,
  Library,
  BarChart3,
  Settings,
  CalendarClock,
  Milestone,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: '대시보드', path: '/', icon: LayoutDashboard },
  { label: '오늘의 할일', path: '/today', icon: CalendarClock },
  { label: '주간 보기', path: '/weekly', icon: CalendarDays },
  { label: '캘린더', path: '/calendar', icon: Calendar },
  { label: '칸반 보드', path: '/kanban', icon: Kanban },
  { label: '마일스톤', path: '/milestone', icon: Milestone },
  { label: '일일 보고', path: '/report', icon: ClipboardList },
  { label: '자료실', path: '/library', icon: Library },
  { label: '통계', path: '/stats', icon: BarChart3 },
  { label: '설정', path: '/settings', icon: Settings },
];

export const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  closed: 'Closed',
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export const STATUS_COLORS: Record<string, string> = {
  open: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  closed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

export const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export const RECURRENCE_LABELS: Record<string, string> = {
  daily: '매일',
  weekly: '매주',
  weekdays: '매주 요일 지정',
  monthly: '매월',
};

export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
