# Daily Planner

개인용 데일리 플래닝 대시보드. 업무 일지, 칸반 보드, 캘린더, 마일스톤, 통계 등 다양한 뷰를 통해 효율적으로 일정과 프로젝트를 관리합니다.

> **Live Demo**: https://jooyoung1121.github.io/daily_planner/

## Features

### 업무 관리
- **칸반 보드**: 드래그앤드롭으로 업무 상태 관리 (할 일 / 진행 중 / 완료)
- **상위·하위 이슈**: Jira 스타일의 계층적 태스크 구조
- **서브태스크**: 태스크 내 인라인 체크리스트
- **반복 업무**: 매일/매주/평일/매월 반복 설정
- **우선순위 & 카테고리**: 태그, 마감일, 필터 검색

### 뷰 & 페이지
| 페이지 | 설명 |
|--------|------|
| **대시보드** | 오늘의 업무 현황, 통계 요약, 오늘의 체크리스트 |
| **오늘** | 일일 스케줄 + 뽀모도로 타이머 (25/15/45분) |
| **주간** | 7일 그리드 뷰, 미배정 업무 관리 |
| **캘린더** | 월/주/일/어젠다 뷰 (react-big-calendar) |
| **칸반** | 드래그앤드롭 상태 보드 |
| **마일스톤** | 프로젝트 단계별 진행 추적 (아코디언 방식) |
| **일일 보고서** | 업무 선택 체크박스 + 미리보기, 날짜 필터, 템플릿 저장 |
| **자료실** | 메일 템플릿, 코드 스니펫, 프로세스 문서, 링크 관리 |
| **통계** | 업무 완료율, 우선순위 분포, 14일 트렌드, 카테고리 분석 |
| **설정** | 테마, 카테고리, 루틴, 메뉴 커스텀, 데이터 백업/복원 |

### 기타 기능
- **다크/라이트/시스템 테마** 지원
- **커스텀 페이지** 생성
- **메뉴 순서 커스텀** & 사이드바 접기
- **루틴 관리**: 고정 루틴 자동 등록
- **데이터 Export/Import**: JSON 백업/복원
- **Excel 가져오기**: 업무일지 시트 파싱
- **페이지별 가이드 배너**: 각 페이지 사용법 안내
- **오프라인 지원**: IndexedDB 기반 로컬 저장

## Tech Stack

| 분류 | 기술 |
|------|------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |
| Database | Dexie.js (IndexedDB) |
| Drag & Drop | @dnd-kit |
| Calendar | react-big-calendar |
| Charts | Recharts |
| Icons | Lucide React |
| Date | date-fns (한국어 로케일) |
| File I/O | xlsx |

## Project Structure

```
src/
├── components/
│   ├── calendar/        # 캘린더 페이지
│   ├── custom/          # 커스텀 페이지
│   ├── daily-log/       # 데일리 로그
│   ├── dashboard/       # 대시보드
│   ├── kanban/          # 칸반 보드
│   ├── layout/          # MainLayout, Sidebar, Header
│   ├── library/         # 자료실
│   ├── milestone/       # 마일스톤
│   ├── report/          # 일일 보고서
│   ├── settings/        # 설정
│   ├── stats/           # 통계
│   ├── tasks/           # 태스크 공통 컴포넌트
│   ├── today/           # 오늘 페이지
│   ├── weekly/          # 주간 페이지
│   └── common/          # 공통 UI (다이얼로그, 뱃지 등)
├── db/                  # Dexie 스키마
├── hooks/               # useTheme, useDebounce
├── lib/                 # 유틸리티, 상수, 날짜, 시드 데이터
├── stores/              # Zustand 스토어
└── types/               # TypeScript 타입 정의
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

GitHub Pages에 자동 배포됩니다 (`main` 브랜치 push 시).
