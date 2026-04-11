import {
  LayoutDashboard,
  Calendar,
  Kanban,
  BookOpen,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: '대시보드', path: '/', icon: LayoutDashboard },
  { label: '캘린더', path: '/calendar', icon: Calendar },
  { label: '칸반 보드', path: '/kanban', icon: Kanban },
  { label: '데일리 로그', path: '/daily-log', icon: BookOpen },
  { label: '통계', path: '/stats', icon: BarChart3 },
  { label: '설정', path: '/settings', icon: Settings },
];

export const STATUS_LABELS: Record<string, string> = {
  todo: '할 일',
  'in-progress': '진행 중',
  done: '완료',
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

export const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};
