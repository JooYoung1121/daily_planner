import { db } from '@/db/database';
import type { Task } from '@/types/task';

const SEED_TASKS = [
  { title: "올리브영 크리에이터", description: "협업 크리에이터 리스트업 및 컨택 프로세스 관리", category: "크리에이터", status: "in-progress" as const, dueDate: null, createdDate: "2026-04-07" },
  { title: "노세범 선크림 플러스 시안 서치", description: "디자인 레퍼런스 및 시안 서치 (자료 금일 전달 예정)\n\n비고: 자료 수급 후 즉시 검토", category: "콘텐츠", status: "in-progress" as const, dueDate: "2026-04-10", createdDate: "2026-04-07" },
  { title: "올리브영 5월 광고 소재 기획", description: "5월 캠페인용 광고 소재 기획안 작성 및 디자인팀 전달 준비\n\n비고: 디자인팀 협업 필요", category: "콘텐츠", status: "in-progress" as const, dueDate: "2026-04-17", createdDate: "2026-04-07" },
  { title: "올리브영 카플친 메시지 기획", description: "카카오 플러스 친구 전송 메시지 기획 및 리테일팀 확인\n\n비고: **리테일팀 프로모션 확정 여부 확인 필수**", category: "CRM", status: "open" as const, dueDate: "2026-04-20", createdDate: "2026-04-07" },
  { title: "복지몰 가입", description: "사내 복지 포인트 사용을 위한 복지몰 계정 생성 및 인증\n\n비고: 익월 경영지원팀 회원등록 후 진행", category: "개인/행정", status: "open" as const, dueDate: null, createdDate: "2026-04-07" },
  { title: "개인법인카드 신청", description: "업무용 비용 정산을 위한 개인법인카드 신청서 작성 및 제출\n\n비고: 카드 배송 대기중", category: "개인/행정", status: "in-progress" as const, dueDate: null, createdDate: "2026-04-07" },
  { title: "박지훈 광고 촬영", description: "3SKU 광고 촬영", category: "콘텐츠", status: "open" as const, dueDate: "2026-04-15", createdDate: "2026-04-07" },
  { title: "PC 보안검사", description: "피싱 방지를 위한 보안점검 후 경영지원팀 전달", category: "개인/행정", status: "closed" as const, dueDate: "2026-04-07", createdDate: "2026-04-07" },
  { title: "PC 백신 프로그램 다운로드", description: "보안 강화를 위한 프로그램 다운로드", category: "개인/행정", status: "closed" as const, dueDate: "2026-04-07", createdDate: "2026-04-07" },
  { title: "pdrn 버블 클렌저 모델 셀렉", description: "수진과장님 서포트", category: "콘텐츠", status: "closed" as const, dueDate: "2026-04-08", createdDate: "2026-04-08" },
  { title: "올리브영 크리에이터 - 테스트 발송", description: "담당자 변경 및 테스트 발송 문의 메일 4건 (6월 올영세일 YT PPL)\n\n비고: 단이, 김퍼프, 이리유, 해니", category: "크리에이터", status: "closed" as const, dueDate: "2026-04-08", createdDate: "2026-04-08" },
  { title: "테스트 제품 기안 상신", description: "김퍼프, 이리유 2건", category: "크리에이터", status: "closed" as const, dueDate: null, createdDate: "2026-04-08" },
  { title: "인수인계 - 크리에이터/바이럴/상세페이지", description: "크리에이터 / 바이럴 / 상세페이지 업무 관련", category: "CRM", status: "closed" as const, dueDate: null, createdDate: "2026-04-08" },
  { title: "매거진 에디터 제품 포장", description: "효정대리님 서포트 / 더북컴퍼니 에디터용 33개 포장", category: "바이럴", status: "closed" as const, dueDate: "2026-04-08", createdDate: "2026-04-08" },
  { title: "개인법인카드 본인확인전화", description: "롯데카드 유선 확인, 영업일 기준 배송 5일 소요", category: "개인/행정", status: "closed" as const, dueDate: "2026-04-08", createdDate: "2026-04-08" },
  { title: "올리브영 크리에이터 - 퀵발송", description: "테스트 제품 퀵발송 1건 (해니)", category: "크리에이터", status: "open" as const, dueDate: null, createdDate: "2026-04-09" },
  { title: "더쿠 체험단 월 진행 횟수 문의", description: "제품 선정 방법 확인 필요", category: "바이럴", status: "open" as const, dueDate: null, createdDate: "2026-04-09" },
  { title: "박지훈 브랜드영상 컨셉 아이데이션", description: "10시 30분~11시 30분 (1시간 소요)", category: "촬영", status: "open" as const, dueDate: null, createdDate: "2026-04-10" },
  { title: "상세페이지 모델 연출컷 변경", description: "피그마 작업", category: "콘텐츠", status: "open" as const, dueDate: null, createdDate: "2026-04-10" },
  { title: "노세범 선크림 연출컷 레퍼런스 서칭", description: "", category: "콘텐츠", status: "open" as const, dueDate: null, createdDate: "2026-04-10" },
  { title: "신규 입사자 제품교육", description: "15:30 진행", category: "개인/행정", status: "open" as const, dueDate: "2026-04-10", createdDate: "2026-04-10" },
];

export async function seedData() {
  const existingCount = await db.tasks.count();
  if (existingCount > 0) return false; // Don't seed if data exists

  const now = new Date().toISOString();
  const tasks: Task[] = SEED_TASKS.map((s, i) => ({
    id: crypto.randomUUID(),
    title: s.title,
    description: s.description,
    status: s.status,
    priority: s.dueDate && s.dueDate <= '2026-04-12' ? 'high' as const : 'medium' as const,
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

  await db.tasks.bulkAdd(tasks);
  return true;
}
