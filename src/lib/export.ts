import { db } from '@/db/database';

interface ExportData {
  version: 1;
  exportedAt: string;
  tasks: unknown[];
  dailyLogs: unknown[];
}

export async function exportAllData(): Promise<string> {
  const [tasks, dailyLogs] = await Promise.all([
    db.tasks.toArray(),
    db.dailyLogs.toArray(),
  ]);

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
    dailyLogs,
  };

  return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonString: string): Promise<void> {
  const data: ExportData = JSON.parse(jsonString);

  if (data.version !== 1) {
    throw new Error('지원하지 않는 데이터 형식입니다.');
  }

  await db.transaction('rw', db.tasks, db.dailyLogs, async () => {
    await db.tasks.clear();
    await db.dailyLogs.clear();
    await db.tasks.bulkAdd(data.tasks as never[]);
    await db.dailyLogs.bulkAdd(data.dailyLogs as never[]);
  });
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.tasks, db.dailyLogs, async () => {
    await db.tasks.clear();
    await db.dailyLogs.clear();
  });
}

export function downloadJson(data: string, filename: string) {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
