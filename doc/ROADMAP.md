# IncidentPilot — ROADMAP

> 해커톤 1일 개발 기준 작업 현황 및 향후 계획
>
> **범례**: ✅ 완료 · 🔲 예정

---

## 완료된 작업

### Task 1: 프로젝트 기반 세팅 ✅
- Tailwind CSS v4 초기화 (`index.css` — `@import "tailwindcss"`)
- Vite 기본 템플릿 코드 제거 (`App.tsx`, `App.css` 정리)
- `.env.example` 생성 (`VITE_CLAUDE_API_KEY`)
- TypeScript 타입 정의 파일 생성 (`src/types/index.ts`)
  - `Runbook`, `RunbookStep`, `Incident`, `MatchResult`, `ChecklistItem`, `TimelineEntry`, `AnalysisResult`, `ViewMode`, `InputTab`

### Task 2: 목데이터 작성 ✅
- `src/data/runbooks.json` — 런북 6개
  - DB 커넥션 풀 고갈, API 5xx 에러, Redis 메모리 초과, 디스크 용량 부족, SSL 인증서 만료, Kafka 컨슈머 랙
  - 각 런북: id, title, description, tags, severity, steps (명령어·소요시간 포함)
- `src/data/incidents.json` — 과거 장애 이력 13건
  - 서비스명, 증상, 원인, 해결방법, 소요시간, 심각도(P1~P4), 연관 런북 ID
- `src/data/sample-logs/` — 데모용 샘플 로그 3개
  - `db-connection-pool-error.log`
  - `api-5xx-error.log`
  - `redis-oom-error.log`

### Task 3: 공통 레이아웃 & 뷰 전환 ✅
- `src/components/Layout.tsx` — 헤더 (로고 + 앱명)
- `App.tsx`에서 state 기반 뷰 전환 (`dashboard` ↔ `analysis`)

### Task 4: 메인 대시보드 — 장애 입력 UI ✅
- `src/components/IncidentInput.tsx`
  - Tab A: 로그파일 드래그앤드롭 업로드 (파일 선택 버튼 포함)
  - Tab B: 텍스트 직접 입력 (textarea)
  - "AI 분석 시작" 버튼 + 로딩 상태
- `src/components/RecentIncidents.tsx` — 최근 장애 이력 5건 목록

### Task 5: Claude API 연동 ✅
- `src/services/claude.ts`
  - `analyzeIncident()` — 로그/텍스트 → 런북 매칭 (신뢰도%, 근거, 에러 추출)
  - `findSimilarIncidents()` — 유사 과거 장애 AI 검색
  - 모델: `claude-sonnet-4-6`
- `src/services/incidentMatcher.ts` — 키워드 기반 폴백 매처, 인사이트 문구 생성
- `src/services/mock.ts` — **Mock 모드** (API 크레딧 없이 데모 가능)
  - 키워드 스코어링으로 런북 매칭 + 신뢰도 계산
  - 실제 로그에서 에러 라인 추출

### Task 6: 분석 결과 화면 — 3-Column 레이아웃 ✅
- `src/components/AnalysisView.tsx` — 3컬럼 컨테이너
- `src/components/RunbookList.tsx` (좌측 패널)
  - 매칭 런북 1~3개 카드 (🥇🥈🥉 랭킹, 신뢰도 %, 매칭 근거)
  - AI 추출 핵심 에러 요약 영역
- `src/components/PastIncidents.tsx` (우측 패널)
  - 유사 과거 장애 목록 + 인사이트 문구

### Task 7: 체크리스트 UI + 타임라인 ✅
- `src/components/Checklist.tsx` (중앙 패널)
  - 런북 단계별 체크리스트, 완료 토글
  - 현재 진행 단계 하이라이트, 진행률 바
  - 단계별 예상 소요시간 / 명령어 / 주의사항 표시
- `src/components/Timeline.tsx` (우측 패널 탭)
  - 체크 완료 시 자동 타임라인 기록 (시각 + 단계명)
  - 전체 대응 소요시간 표시

### Task 8: 통합 & UI 폴리싱 ✅
- 전체 플로우 연결 (입력 → 분석 → 체크리스트 → 타임라인)
- 로딩 스피너, 에러 메시지 처리
- 다크 테마 (Tailwind CSS)
- lucide-react 아이콘 전면 적용
- Mock 모드 ON/OFF 토글 버튼 (API 없이 데모 가능)

### Task 9: 배포 준비 ✅
- `index.html` 타이틀 → `IncidentPilot`
- `.gitignore` — `.env` 제외, `sample-logs/*.log` 예외 처리
- GitHub 저장소 생성 및 push 완료
  - https://github.com/Hajin-Jeong/IncidentPilot

---

## 백엔드 개발 일감

### Task B1: 프로젝트 기반 세팅 🔲
- `backend/` 폴더 생성 및 FastAPI 프로젝트 초기화
- `requirements.txt` 작성 (`fastapi`, `uvicorn`, `sqlalchemy`, `psycopg2-binary`, `pydantic`)
- `.env.example` 생성 (`DATABASE_URL`, `ALLOWED_ORIGINS`)
- Pydantic 기반 공통 스키마 정의 (`schemas/runbook.py`, `schemas/incident.py`, `schemas/analyze.py`)
  - 프론트엔드와 공유하는 응답 포맷 (`AnalyzeResponse`) 정의
- **산출물**: 실행 가능한 FastAPI 앱 뼈대 (`uvicorn app.main:app`)

### Task B2: DB 모델 & 마이그레이션 🔲
- SQLAlchemy ORM 모델 정의 (`models/runbook.py`, `models/incident.py`)
  - Runbook: id, title, description, tags, severity, steps(JSON), created_at, updated_at
  - Incident: id, date, service, symptom, cause, resolution, duration_minutes, severity, related_runbook_id
- Alembic 마이그레이션 초기 설정
- DB 초기 데이터 시딩 스크립트 (`scripts/seed.py`)
  - 프론트엔드 `runbooks.json`, `incidents.json` 데이터를 DB에 삽입
- **산출물**: DB 스키마 완성 + 시드 데이터 적재

### Task B3: 런북 & 장애 이력 CRUD API 🔲
- `api/runbooks.py`
  - `GET /api/runbooks` — 전체 런북 목록 (페이지네이션)
  - `GET /api/runbooks/{id}` — 런북 상세
  - `POST /api/runbooks` — 런북 등록
  - `PUT /api/runbooks/{id}` — 런북 수정
  - `DELETE /api/runbooks/{id}` — 런북 삭제
- `api/incidents.py`
  - `GET /api/incidents` — 장애 이력 목록 (최신순, 페이지네이션)
  - `GET /api/incidents/{id}` — 장애 이력 상세
  - `POST /api/incidents` — 장애 이력 저장
- **산출물**: 런북/장애 이력 REST API 완성

### Task B4: Mock 분석 엔진 🔲
- `services/extractor.py` — 로그 텍스트에서 핵심 에러 라인 추출
  - ERROR / EXCEPTION / FATAL / OOM 패턴 정규식 추출
  - 중복 제거 후 상위 5개 반환
- `services/matcher.py` — 키워드 스코어링 기반 런북 매칭
  - DB에서 런북 목록 조회 → 태그·설명·제목 키워드 비교
  - 신뢰도 점수 계산 (0~100), 상위 3개 반환
  - 유사 장애 이력 키워드 검색 (상위 5개)
- `api/analyze.py`
  - `POST /api/analyze` — 입력 텍스트 → 분석 결과 반환
  - 응답 포맷: 프론트엔드 AI 모드와 동일한 JSON 구조
- **산출물**: Mock 모드 분석 API 완성, 프론트엔드 연동 가능

### Task B5: 프론트엔드 연동 🔲
- 프론트엔드 `services/mock.ts` 로직을 백엔드 API 호출로 교체
  - `POST /api/analyze` 호출로 대체
  - `GET /api/runbooks`, `GET /api/incidents` 호출로 정적 JSON 대체
- `.env`에 `VITE_BACKEND_URL` 추가
- CORS 설정 확인 (백엔드 `ALLOWED_ORIGINS`)
- **산출물**: Mock 모드에서 백엔드와 완전 연동

### Task B6: Docker Compose 구성 🔲
- `backend/Dockerfile` 작성
- 루트 `docker-compose.yml` 작성
  - `frontend` (Vite 빌드 + Nginx)
  - `backend` (FastAPI + Uvicorn)
  - `db` (PostgreSQL)
- `docker-compose.dev.yml` — 로컬 개발용 (볼륨 마운트, 핫리로드)
- **산출물**: `docker compose up` 한 번으로 전체 스택 실행

---

## 현재 파일 구조

```
IncidentPilot/
├── .claude/
├── .git/
├── doc/
│   ├── PROD.md
│   └── ROADMAP.md
├── frontend/                        # 프론트엔드 (Vite + React)
│   ├── src/
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── data/
│   │   │   ├── runbooks.json
│   │   │   ├── incidents.json
│   │   │   └── sample-logs/
│   │   │       ├── db-connection-pool-error.log
│   │   │       ├── api-5xx-error.log
│   │   │       └── redis-oom-error.log
│   │   ├── services/
│   │   │   ├── claude.ts
│   │   │   ├── incidentMatcher.ts
│   │   │   └── mock.ts
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── IncidentInput.tsx
│   │   │   ├── RecentIncidents.tsx
│   │   │   ├── AnalysisView.tsx
│   │   │   ├── RunbookList.tsx
│   │   │   ├── Checklist.tsx
│   │   │   ├── PastIncidents.tsx
│   │   │   ├── StatsBar.tsx
│   │   │   ├── RunbookCatalog.tsx
│   │   │   └── Timeline.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
└── backend/                         # 백엔드 (FastAPI) — 개발 예정
    ├── app/
    │   ├── main.py
    │   ├── api/
    │   │   ├── analyze.py
    │   │   ├── runbooks.py
    │   │   └── incidents.py
    │   ├── services/
    │   │   ├── matcher.py
    │   │   └── extractor.py
    │   ├── models/
    │   │   ├── runbook.py
    │   │   └── incident.py
    │   └── db.py
    ├── Dockerfile
    └── requirements.txt
```

---

## 향후 개선 과제 (Post-Hackathon)

| 우선순위 | 항목 | 설명 |
|--------|------|------|
| High | Teams 웹훅 연동 | 장애 알림을 Teams에서 직접 수신하여 자동 분석 트리거 |
| High | PagerDuty 연동 | 온콜 알림과 런북 매칭 자동화 |
| Medium | 포스트모템 자동 생성 | 타임라인 기반으로 장애 보고서 초안 생성 |
| Medium | 런북 에디터 | 웹 UI에서 런북 추가/수정 |
| Medium | 팀 장애 통계 대시보드 | MTTR 트렌드, 서비스별 장애 빈도 시각화 |
| Low | 런북 자동 업데이트 | 장애 해결 후 AI가 런북에 새 정보 반영 제안 |
| Low | 런북 미존재 시 임시 가이드 | 매칭 런북 없을 때 AI가 즉석 대응 가이드 생성 |
| Low | 다국어 지원 | 영문 런북 지원 |
