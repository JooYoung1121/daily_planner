import { db } from '@/db/database';
import type { Task, TaskStatus } from '@/types/task';

interface SeedTask {
  title: string;
  description: string;
  category: string;
  status: TaskStatus;
  dueDate: string | null;
  createdDate: string;
}

const SEED_TASKS: SeedTask[] = [
  { title: "올리브영 크리에이터", description: "협업 크리에이터 리스트업 및 컨택 프로세스 관리", category: "크리에이터", status: "in-progress", dueDate: null, createdDate: "2026-04-07" },
  { title: "노세범 선크림 플러스 시안 서치", description: "디자인 레퍼런스 및 시안 서치 (자료 금일 전달 예정)\n\n비고: 자료 수급 후 즉시 검토", category: "콘텐츠", status: "in-progress", dueDate: "2026-04-10", createdDate: "2026-04-07" },
  { title: "올리브영 5월 광고 소재 기획", description: "5월 캠페인용 광고 소재 기획안 작성 및 디자인팀 전달 준비\n\n비고: 디자인팀 협업 필요", category: "콘텐츠", status: "in-progress", dueDate: "2026-04-17", createdDate: "2026-04-07" },
  { title: "올리브영 카플친 메시지 기획", description: "카카오 플러스 친구 전송 메시지 기획 및 리테일팀 확인\n\n비고: **리테일팀 프로모션 확정 여부 확인 필수**", category: "CRM", status: "open", dueDate: "2026-04-20", createdDate: "2026-04-07" },
  { title: "복지몰 가입", description: "사내 복지 포인트 사용을 위한 복지몰 계정 생성 및 인증\n\n비고: 익월 경영지원팀 회원등록 후 진행", category: "개인/행정", status: "open", dueDate: null, createdDate: "2026-04-07" },
  { title: "개인법인카드 신청", description: "업무용 비용 정산을 위한 개인법인카드 신청서 작성 및 제출\n\n비고: 카드 배송 대기중", category: "개인/행정", status: "in-progress", dueDate: null, createdDate: "2026-04-07" },
  { title: "박지훈 광고 촬영", description: "3SKU 광고 촬영", category: "콘텐츠", status: "open", dueDate: "2026-04-15", createdDate: "2026-04-07" },
  { title: "PC 보안검사", description: "피싱 방지를 위한 보안점검 후 경영지원팀 전달", category: "개인/행정", status: "closed", dueDate: "2026-04-07", createdDate: "2026-04-07" },
  { title: "PC 백신 프로그램 다운로드", description: "보안 강화를 위한 프로그램 다운로드", category: "개인/행정", status: "closed", dueDate: "2026-04-07", createdDate: "2026-04-07" },
  { title: "pdrn 버블 클렌저 모델 셀렉", description: "수진과장님 서포트", category: "콘텐츠", status: "closed", dueDate: "2026-04-08", createdDate: "2026-04-08" },
  { title: "올리브영 크리에이터 - 테스트 발송", description: "담당자 변경 및 테스트 발송 문의 메일 4건 (6월 올영세일 YT PPL)\n\n비고: 단이, 김퍼프, 이리유, 해니", category: "크리에이터", status: "closed", dueDate: "2026-04-08", createdDate: "2026-04-08" },
  { title: "테스트 제품 기안 상신", description: "김퍼프, 이리유 2건", category: "크리에이터", status: "closed", dueDate: null, createdDate: "2026-04-08" },
  { title: "인수인계 - 크리에이터/바이럴/상세페이지", description: "크리에이터 / 바이럴 / 상세페이지 업무 관련", category: "CRM", status: "closed", dueDate: null, createdDate: "2026-04-08" },
  { title: "매거진 에디터 제품 포장", description: "효정대리님 서포트 / 더북컴퍼니 에디터용 33개 포장", category: "바이럴", status: "closed", dueDate: "2026-04-08", createdDate: "2026-04-08" },
  { title: "개인법인카드 본인확인전화", description: "롯데카드 유선 확인, 영업일 기준 배송 5일 소요", category: "개인/행정", status: "closed", dueDate: "2026-04-08", createdDate: "2026-04-08" },
  { title: "올리브영 크리에이터 - 퀵발송", description: "테스트 제품 퀵발송 1건 (해니)", category: "크리에이터", status: "open", dueDate: null, createdDate: "2026-04-09" },
  { title: "더쿠 체험단 월 진행 횟수 문의", description: "제품 선정 방법 확인 필요", category: "바이럴", status: "open", dueDate: null, createdDate: "2026-04-09" },
  { title: "박지훈 브랜드영상 컨셉 아이데이션", description: "10시 30분~11시 30분 (1시간 소요)", category: "촬영", status: "open", dueDate: null, createdDate: "2026-04-10" },
  { title: "상세페이지 모델 연출컷 변경", description: "피그마 작업", category: "콘텐츠", status: "open", dueDate: null, createdDate: "2026-04-10" },
  { title: "노세범 선크림 연출컷 레퍼런스 서칭", description: "", category: "콘텐츠", status: "open", dueDate: null, createdDate: "2026-04-10" },
  { title: "신규 입사자 제품교육", description: "15:30 진행", category: "개인/행정", status: "closed", dueDate: "2026-04-10", createdDate: "2026-04-10" },
];

function buildTasks(seedTasks: SeedTask[]): Task[] {
  const now = new Date().toISOString();
  return seedTasks.map((s, i) => ({
    id: crypto.randomUUID(),
    title: s.title,
    description: s.description,
    status: s.status,
    priority: (s.dueDate && s.dueDate <= '2026-04-12' ? 'high' : 'medium') as Task['priority'],
    category: s.category,
    tags: [],
    dueDate: s.dueDate,
    dueTime: null,
    sortOrder: (i + 1) * 1000,
    createdAt: s.createdDate ? `${s.createdDate}T09:00:00.000Z` : now,
    updatedAt: now,
    completedAt: s.status === 'closed' ? now : null,
    parentId: null,
    subtasks: [],
    recurrence: null,
    recurrenceSourceId: null,
  }));
}

/** Auto-seed only when DB is empty (first visit) */
export async function seedData() {
  const existingCount = await db.tasks.count();
  if (existingCount > 0) return false;
  await db.tasks.bulkAdd(buildTasks(SEED_TASKS));
  return true;
}

/** Force load seed data (clears existing tasks first) */
export async function forceLoadSeedData(): Promise<number> {
  await db.tasks.clear();
  const tasks = buildTasks(SEED_TASKS);
  await db.tasks.bulkAdd(tasks);
  return tasks.length;
}

/** Parse Excel file (.xlsx) 업무일지 sheet and import as tasks */
export async function importFromExcel(file: File): Promise<number> {
  const XLSX = await import('xlsx');
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });

  // Try to find 업무일지 sheet
  const sheetName = wb.SheetNames.find((n) => n.includes('업무일지')) ?? wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // Find header row (contains '업무명' or '날짜')
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] as string[];
    if (row.some((c) => String(c).includes('업무명') || String(c).includes('날짜'))) {
      headerIdx = i;
      break;
    }
  }

  function excelDateToStr(serial: number): string | null {
    if (typeof serial !== 'number' || serial < 1) return null;
    const d = new Date((serial - 25569) * 86400 * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const parsed: SeedTask[] = [];
  let currentDate = '';

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] as (string | number)[];
    const title = String(row[2] ?? '').trim();
    if (!title) continue;

    // Date column
    if (typeof row[0] === 'number') {
      currentDate = excelDateToStr(row[0]) ?? currentDate;
    }

    const category = String(row[1] ?? '').trim();
    const description = String(row[3] ?? '').trim();
    const deadline = typeof row[5] === 'number' ? excelDateToStr(row[5]) : null;
    const statusRaw = String(row[6] ?? '').trim();
    const notes = String(row[7] ?? '').trim();

    let status: TaskStatus = 'open';
    if (statusRaw === '완료') status = 'closed';
    else if (statusRaw === '진행 중') status = 'in-progress';

    parsed.push({
      title,
      description: (description + (notes ? `\n\n비고: ${notes}` : '')).trim(),
      category,
      status,
      dueDate: deadline,
      createdDate: currentDate || new Date().toISOString().slice(0, 10),
    });
  }

  if (parsed.length === 0) throw new Error('파싱된 업무가 없습니다. 업무일지 시트를 확인하세요.');

  const tasks = buildTasks(parsed);
  // Append to existing (don't clear)
  await db.tasks.bulkAdd(tasks);
  return tasks.length;
}
