# IncidentPilot — PRD (Product Requirements Document) v2.0
> 📁 `D:\Work\Hackathon\IncidentPilot\doc\PROD.md`
> v1.0 → v2.0: Claude API 직접 호출 제거, 자체 백엔드 도입

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | IncidentPilot |
| **한 줄 소개** | 장애 알림을 입력하면 AI가 런북을 자동 매칭하고, 단계별 대응 체크리스트를 제공하는 웹 대시보드 |
| **형태** | 프론트엔드 + 백엔드 분리형 웹앱 |
| **데이터** | 백엔드 DB 기반 (런북, 장애 이력 CRUD) |

---

## 2. 문제 정의

### AS-IS (현재)
- 장애 발생 시 "이거 전에 어떻게 해결했지?" → 슬랙/컨플루언스 검색에 5~15분 소비
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
- **A. 로그파일 업로드**: 로그 파일(.log, .txt)을 드래그앤드롭 또는 파일 선택으로 업로드 → 백엔드가 핵심 에러 자동 추출 → 런북 매칭
- **B. 텍스트 직접 입력**: 에러 메시지, 알림 내용을 직접 텍스트로 입력 → 런북 매칭

**처리**: 백엔드 AI 엔진이 입력된 장애 정보를 분석하여 등록된 런북과 벡터 유사도 기반으로 매칭

**출력**
- 관련도 높은 런북 1~3개를 랭킹과 함께 표시
- 매칭 신뢰도(%) 표시, 매칭 근거 요약
- (로그파일 업로드 시) 추출한 핵심 에러 요약 별도 표시

### 기능 2: 체크리스트 기반 대응 가이드
- 매칭된 런북을 단계별 체크리스트로 변환하여 표시
- 각 단계 완료 체크 가능 + 진행 상태 백엔드 저장
- 현재 진행 단계 하이라이트, 단계별 예상 소요시간 표시
- 타임라인 자동 기록 (몇 시 몇 분에 어떤 단계 완료)

### 기능 3: 과거 유사 장애 이력 조회
- 입력된 장애 정보와 유사한 과거 장애 목록 표시 (벡터 유사도 검색)
- 각 이력에 발생일, 원인, 해결방법, 소요시간 요약
- 인사이트 문구 제공

### 기능 4: 런북 & 장애 이력 관리 (백엔드 신규)
- 런북 CRUD API (등록 / 조회 / 수정 / 삭제)
- 장애 이력 저장 API (대응 완료 후 자동 저장)
- 런북/장애 데이터 임베딩 벡터 자동 생성 및 저장

---

## 4. 화면 구성

### 4-1. 메인 대시보드
- 장애 입력 영역: 로그파일 드래그앤드롭 존 + 텍스트 직접 입력 탭 전환
- "분석 시작" 버튼
- 운영 현황 통계 (런북 수, 누적 장애, P1 건수, 평균 해결시간)
- 최근 장애 이력 + 런북 카탈로그

### 4-2. 분석 결과 화면 (3-Column 레이아웃)
- **좌측**: 매칭된 런북 목록 (랭킹, 신뢰도, 매칭 근거)
- **중앙**: 선택한 런북의 체크리스트 (대응 가이드)
- **우측**: 유사 과거 장애 이력 패널 / 대응 타임라인

### 4-3. 장애 타임라인 뷰
- 체크리스트 진행 중 자동 기록되는 타임라인
- 각 단계 완료 시각, 전체 대응 소요시간

---

## 5. 기술 구성 (v2.0)

| 영역 | 기술 |
|------|------|
| **프론트엔드** | React + TypeScript + Vite + Tailwind CSS v4 |
| **백엔드** | FastAPI (Python) |
| **AI 매칭** | LLM (Ollama 로컬 또는 OpenAI 호환 API) + 벡터 임베딩 유사도 검색 |
| **임베딩** | sentence-transformers (`paraphrase-multilingual-MiniLM-L12-v2`) |
| **벡터 검색** | FAISS 또는 pgvector |
| **DB** | PostgreSQL (런북, 장애 이력, 임베딩 벡터) |
| **통신** | REST API (JSON) |
| **배포** | Docker Compose (frontend + backend + DB) |

---

## 6. 백엔드 아키텍처

### 디렉토리 구조
```
backend/
├── app/
│   ├── main.py                # FastAPI 앱 진입점
│   ├── api/
│   │   ├── analyze.py         # POST /analyze — 장애 분석 엔드포인트
│   │   ├── runbooks.py        # GET/POST/PUT/DELETE /runbooks
│   │   └── incidents.py       # GET/POST /incidents
│   ├── services/
│   │   ├── matcher.py         # 런북 매칭 로직 (임베딩 유사도)
│   │   ├── extractor.py       # 로그에서 핵심 에러 추출
│   │   └── embedder.py        # 텍스트 → 벡터 변환
│   ├── models/
│   │   ├── runbook.py         # Runbook ORM 모델
│   │   └── incident.py        # Incident ORM 모델
│   └── db.py                  # DB 연결 설정
├── Dockerfile
└── requirements.txt
```

### 핵심 API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/analyze` | 로그/텍스트 입력 → 런북 매칭 + 유사 장애 반환 |
| `GET` | `/api/runbooks` | 전체 런북 목록 조회 |
| `GET` | `/api/runbooks/{id}` | 런북 상세 조회 |
| `POST` | `/api/runbooks` | 런북 등록 |
| `PUT` | `/api/runbooks/{id}` | 런북 수정 |
| `DELETE` | `/api/runbooks/{id}` | 런북 삭제 |
| `GET` | `/api/incidents` | 장애 이력 목록 조회 |
| `POST` | `/api/incidents` | 장애 이력 저장 |

### `/api/analyze` 처리 흐름

```
1. 입력 수신 (로그 텍스트)
       ↓
2. 핵심 에러 추출 (extractor.py)
   - 정규식 기반 ERROR/EXCEPTION/FATAL 라인 추출
   - LLM으로 에러 요약 생성
       ↓
3. 입력 텍스트 임베딩 변환 (embedder.py)
       ↓
4. 런북 벡터 DB에서 코사인 유사도 검색 (matcher.py)
   → 상위 3개 런북 + 신뢰도 점수
       ↓
5. 유사 장애 이력 검색
   → 상위 5개 이력
       ↓
6. 결과 JSON 반환
```

### AI 매칭 방식

**1단계 — 벡터 유사도 (주요)**
- 런북/장애 이력을 사전에 임베딩하여 DB에 저장
- 입력 텍스트를 임베딩 후 코사인 유사도 계산
- 외부 API 호출 없이 로컬에서 동작

**2단계 — LLM 보강 (선택적)**
- 상위 매칭 결과에 대해 LLM이 매칭 근거 자연어 설명 생성
- Ollama (로컬) 또는 OpenAI 호환 엔드포인트 사용 가능
- LLM 없이도 동작 (근거 설명만 생략)

---

## 7. 데이터 모델

### Runbook
```python
id: str
title: str
description: str
tags: list[str]
severity: Literal['P1', 'P2', 'P3', 'P4']
steps: list[RunbookStep]
embedding: list[float]  # 벡터 (DB 저장)
created_at: datetime
updated_at: datetime
```

### Incident
```python
id: str
date: datetime
service: str
symptom: str
cause: str
resolution: str
duration_minutes: int
severity: Literal['P1', 'P2', 'P3', 'P4']
related_runbook_id: str
embedding: list[float]  # 벡터 (DB 저장)
```

---

## 8. 데모 시나리오 (3분)

> **상황**: 새벽 3시, 온콜 엔지니어에게 슬랙 알림이 옵니다.
> "payment-service 5xx 에러 급증, 에러율 15% 돌파"

1. **[0:00~0:30]** 대시보드에 실제 로그파일(.log)을 드래그앤드롭으로 업로드
2. **[0:30~1:00]** 백엔드가 로그에서 핵심 에러 추출 → "API 서버 5xx 에러 급증 대응" 런북 자동 매칭 (신뢰도 92%)
3. **[1:00~1:30]** 체크리스트 단계별로 진행 — 각 단계 체크하며 타임라인 자동 기록
4. **[1:30~2:15]** 우측 패널에서 과거 유사 장애 3건 확인 — 인사이트 발견
5. **[2:15~3:00]** 대응 완료 후 타임라인 리뷰, 확장 가능성 언급

---

## 9. 확장 가능성

- 슬랙/PagerDuty 웹훅 연동으로 자동 장애 인풋
- 포스트모템 리포트 자동 생성
- 런북 자동 업데이트 (장애 해결 후 새로운 정보 반영)
- 팀별 장애 통계 대시보드
- 런북 미존재 시 AI가 임시 대응 가이드 자동 생성
