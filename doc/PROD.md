# IncidentPilot — PRD (Product Requirements Document) v2.1
> 📁 `D:\Work\Hackathon\IncidentPilot\doc\PROD.md`
> v2.0 → v2.1: Mock 모드 전용 자체 백엔드 도입. Claude API는 실제 분석에 유지.

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | IncidentPilot |
| **한 줄 소개** | 장애 알림을 입력하면 AI가 런북을 자동 매칭하고, 단계별 대응 체크리스트를 제공하는 웹 대시보드 |
| **형태** | 프론트엔드 + 백엔드 분리형 웹앱 |
| **데이터** | 백엔드 DB 기반 (런북, 장애 이력 관리) |

---

## 2. 문제 정의

### AS-IS (현재)
- 장애 발생 시 "이거 전에 어떻게 해결했지?" → Teams/컨플루언스 검색에 5~15분 소비
- 런북이 있어도 찾기 어렵고, 있는지조차 모르는 경우 다수
- 과거 유사 장애 이력이 개인 기억에 의존
- 장애 대응 중 체크리스트 없이 머릿속으로 진행 → 단계 누락 위험

### TO-BE (목표)
- 장애 정보 입력 → 30초 내 관련 런북 자동 매칭
- 단계별 체크리스트로 빠짐없이 대응
- 과거 유사 장애 이력을 즉시 참조
- MTTR(평균 복구 시간) 단축에 기여

---

## 3. 핵심 기능 (MVP Scope)

### 기능 1: 장애 입력 → 런북 자동 매칭
**입력 방식 (2가지 지원)**
- **A. 로그파일 업로드**: 로그 파일(.log, .txt)을 드래그앤드롭 또는 파일 선택으로 업로드
- **B. 텍스트 직접 입력**: 에러 메시지, 알림 내용을 직접 텍스트로 입력

**출력**
- 관련도 높은 런북 1~3개를 랭킹과 함께 표시
- 매칭 신뢰도(%) 표시, 매칭 근거 요약
- 로그 업로드 시 추출한 핵심 에러 요약 표시

### 기능 2: 체크리스트 기반 대응 가이드
- 매칭된 런북을 단계별 체크리스트로 변환하여 표시
- 각 단계 완료 체크, 현재 진행 단계 하이라이트, 예상 소요시간 표시
- 타임라인 자동 기록

### 기능 3: 과거 유사 장애 이력 조회
- 유사한 과거 장애 목록 및 인사이트 문구 제공

### 기능 4: 런북 & 장애 이력 관리 API (백엔드)
- 런북 CRUD
- 장애 이력 조회/저장

---

## 4. 화면 구성

### 4-1. 메인 대시보드
- 장애 입력 영역 (파일 업로드 + 텍스트 입력)
- 운영 현황 통계, 최근 장애 이력, 런북 카탈로그
- **AI 모드 / Mock 모드 토글** (우측 상단)

### 4-2. 분석 결과 화면 (3-Column 레이아웃)
- **좌측**: 매칭 런북 목록 (랭킹, 신뢰도, 근거)
- **중앙**: 체크리스트 대응 가이드
- **우측**: 유사 과거 장애 이력 / 대응 타임라인

---

## 5. 분석 모드 설계 (핵심)

IncidentPilot은 두 가지 분석 모드를 지원합니다. 프론트엔드에서 모드를 선택하면 호출 대상이 달라집니다.

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│                                                      │
│   [AI 모드 토글] ──────────────── [Mock 모드 토글]    │
│         │                                │          │
│         ▼                                ▼          │
│  Claude API 직접 호출          Backend API 호출      │
│  (브라우저 → Anthropic)        (브라우저 → 백엔드)   │
└─────────────────────────────────────────────────────┘
         │                                │
         ▼                                ▼
  Claude API                    FastAPI Backend
  (LLM 기반 매칭)               (규칙/키워드 기반 매칭)
```

### AI 모드 (Claude API)
- 프론트엔드에서 Anthropic Claude API 직접 호출
- LLM이 로그를 이해하고 런북 매칭 + 근거 생성
- `VITE_CLAUDE_API_KEY` 필요
- 응답 품질 높음, API 크레딧 소비

### Mock 모드 (자체 백엔드)
- 프론트엔드에서 자체 백엔드 API 호출 (`/api/analyze`)
- 백엔드가 키워드/규칙 기반으로 런북 매칭
- API 키 불필요, 오프라인 동작 가능
- 데모·개발 환경에서 활용

---

## 6. 기술 구성

| 영역 | 기술 |
|------|------|
| **프론트엔드** | React + TypeScript + Vite + Tailwind CSS v4 |
| **백엔드 (Mock 모드)** | FastAPI (Python) |
| **AI 매칭 (AI 모드)** | Claude API (`claude-sonnet-4-6`) |
| **Mock 매칭** | 키워드 스코어링 + 규칙 기반 |
| **DB** | PostgreSQL (런북, 장애 이력) |
| **배포** | Docker Compose (frontend + backend + DB) |

---

## 7. 백엔드 설계

### 디렉토리 구조
```
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── analyze.py       # POST /api/analyze (Mock 모드용)
│   │   ├── runbooks.py      # GET/POST/PUT/DELETE /api/runbooks
│   │   └── incidents.py     # GET/POST /api/incidents
│   ├── services/
│   │   ├── matcher.py       # 키워드 기반 런북 매칭
│   │   └── extractor.py     # 로그에서 에러 라인 추출
│   └── db.py
├── Dockerfile
└── requirements.txt
```

### API 엔드포인트

| Method | Path | 모드 | 설명 |
|--------|------|------|------|
| `POST` | `/api/analyze` | Mock | 로그/텍스트 → 런북 매칭 + 유사 장애 반환 |
| `GET` | `/api/runbooks` | 공통 | 런북 목록 조회 |
| `GET` | `/api/runbooks/{id}` | 공통 | 런북 상세 조회 |
| `POST` | `/api/runbooks` | 공통 | 런북 등록 |
| `PUT` | `/api/runbooks/{id}` | 공통 | 런북 수정 |
| `DELETE` | `/api/runbooks/{id}` | 공통 | 런북 삭제 |
| `GET` | `/api/incidents` | 공통 | 장애 이력 목록 조회 |
| `POST` | `/api/incidents` | 공통 | 장애 이력 저장 |

### `/api/analyze` 처리 흐름 (Mock 모드)

```
1. 입력 수신 (로그 텍스트)
       ↓
2. 정규식 기반 핵심 에러 라인 추출
       ↓
3. 키워드 스코어링으로 런북 매칭
   (DB에서 런북 목록 조회 → 태그/설명과 키워드 비교)
       ↓
4. 유사 장애 이력 키워드 검색 (DB)
       ↓
5. AI 모드와 동일한 응답 포맷으로 반환
```

### 응답 포맷 (AI 모드 / Mock 모드 공통)

프론트엔드는 모드에 관계없이 동일한 데이터 구조를 받습니다.

```json
{
  "matches": [
    {
      "runbookId": "rb-001",
      "confidence": 88,
      "reasoning": "매칭 근거 설명"
    }
  ],
  "extractedErrors": ["에러 메시지 1", "에러 메시지 2"],
  "summary": "장애 상황 한줄 요약",
  "similarIncidentIds": ["inc-001", "inc-003"]
}
```

---

## 8. 데이터 모델

### Runbook
```
id, title, description, tags[], severity, steps[], created_at, updated_at
```

### Incident
```
id, date, service, symptom, cause, resolution, duration_minutes, severity, related_runbook_id
```

---

## 9. 데모 시나리오 (3분)

> **상황**: 새벽 3시, 온콜 엔지니어에게 Teams 알림.
> "payment-service 5xx 에러 급증, 에러율 15% 돌파"

1. **[0:00~0:30]** Mock 모드로 로그파일 드래그앤드롭 업로드
2. **[0:30~1:00]** 백엔드가 에러 추출 → 런북 자동 매칭 (신뢰도 92%)
3. **[1:00~1:30]** 체크리스트 단계별 진행, 타임라인 자동 기록
4. **[1:30~2:15]** 과거 유사 장애 3건 확인, 인사이트 발견
5. **[2:15~3:00]** AI 모드 전환 시 Claude API로 더 정확한 분석 가능함을 시연

---

## 10. 확장 가능성

- Teams/PagerDuty 웹훅 연동으로 자동 장애 인풋
- 포스트모템 리포트 자동 생성
- 런북 자동 업데이트 (장애 해결 후 새로운 정보 반영)
- 팀별 장애 통계 대시보드
- Mock 백엔드에 벡터 임베딩 기반 유사도 검색 추가
