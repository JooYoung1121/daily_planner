import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO, differenceInDays, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return '오늘';
  if (isTomorrow(date)) return '내일';
  if (isYesterday(date)) return '어제';
  return format(date, 'M월 d일 (EEE)', { locale: ko });
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), 'M월 d일 HH:mm', { locale: ko });
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: ko });
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function todayString(): string {
  return toDateString(new Date());
}

/** Returns D-day string: "D-3", "D-Day", "D+2" */
export function getDday(dueDateStr: string): { label: string; overdue: boolean; days: number } {
  const today = startOfDay(new Date());
  const due = startOfDay(parseISO(dueDateStr));
  const diff = differenceInDays(due, today);
  if (diff === 0) return { label: 'D-Day', overdue: false, days: 0 };
  if (diff > 0) return { label: `D-${diff}`, overdue: false, days: diff };
  return { label: `D+${Math.abs(diff)}`, overdue: true, days: diff };
}
