# Daily Planner

개인용 데일리 플래닝 대시보드. 매일 업무 일지를 관리하고 칸반 보드, 캘린더, 통계를 통해 효율적으로 일정을 관리합니다.

## Features

- **대시보드**: 오늘의 업무 현황, 통계 요약
- **칸반 보드**: 드래그앤드롭으로 업무 상태 관리 (할 일 / 진행 중 / 완료)
- **캘린더**: 일/주/월 뷰로 일정 확인
- **데일리 로그**: 날짜별 업무 일지 작성 (자동저장)
- **통계**: 업무 완료율, 생산성 트렌드 차트
- **다크/라이트 테마**: 시스템 설정 연동
- **데이터 Export/Import**: JSON 백업/복원

## Tech Stack

React 19 + TypeScript, Vite, Tailwind CSS, Zustand, Dexie.js (IndexedDB), @dnd-kit, react-big-calendar, recharts

## Development

```bash
npm install
npm run dev
```

## Deploy

GitHub Pages에 자동 배포됩니다 (`main` 브랜치 push 시).

https://jooyoung1121.github.io/daily_planner/
