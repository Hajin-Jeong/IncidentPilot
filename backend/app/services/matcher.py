from sqlalchemy.orm import Session
from app.models.runbook import Runbook
from app.models.incident import Incident
from app.schemas.analyze import MatchResult

# Keywords per runbook id — used for scoring
RUNBOOK_KEYWORDS: dict[str, list[str]] = {
    "rb-001": ["hikari", "connection pool", "jdbc", "pool exhausted", "pool stats",
               "connectiontimeout", "커넥션", "active=", "idle=0", "waiting="],
    "rb-002": ["5xx", "500", "503", "server error", "badgrammar", "rollback",
               "migration", "stacktrace", "exception", "deploy", "schema"],
    "rb-003": ["redis", "oom", "out of memory", "maxmemory", "jedis",
               "eviction", "메모리", "cache", "jedisdataexception"],
    "rb-004": ["disk", "no space left", "filesystem", "/tmp", "logrotate",
               "디스크", "용량", "quota", "inode"],
    "rb-005": ["ssl", "tls", "certificate", "cert", "x509",
               "expired", "인증서", "handshake", "certbot"],
    "rb-006": ["kafka", "consumer", "lag", "offset", "partition",
               "랙", "컨슈머", "rebalance", "broker"],
}

REASONINGS: dict[str, list[str]] = {
    "rb-001": [
        "HikariPool 커넥션 풀 고갈 패턴이 감지되었습니다. active=max, idle=0 상태로 대기 요청이 급증하고 있습니다.",
        "DB 커넥션 타임아웃 에러가 반복 발생 중입니다. 풀 크기 설정 오류 또는 커넥션 누수가 원인일 가능성이 높습니다.",
    ],
    "rb-002": [
        "배포 직후 5xx 에러가 급증하는 패턴이 감지되었습니다. DB 스키마 불일치 또는 코드 버그가 원인일 수 있습니다.",
        "HTTP 500/503 에러와 스택트레이스가 다수 감지되었습니다. 최근 배포 이력을 즉시 확인하세요.",
    ],
    "rb-003": [
        "Redis OOM(Out of Memory) 에러가 감지되었습니다. maxmemory 한도를 초과하여 신규 키 저장이 불가한 상태입니다.",
        "Redis 메모리 사용량이 임계치를 초과했습니다. TTL 미설정 키 또는 대용량 키가 원인일 가능성이 높습니다.",
    ],
    "rb-004": [
        "디스크 사용량 초과 패턴이 감지되었습니다. 로그 파일 누적 또는 임시 파일 정리 실패가 원인일 수 있습니다.",
        "No space left on device 패턴이 일치합니다. 즉시 불필요한 파일을 삭제해야 합니다.",
    ],
    "rb-005": [
        "SSL/TLS 인증서 관련 에러가 감지되었습니다. 인증서 만료 또는 자동 갱신 실패가 원인일 수 있습니다.",
        "x509 certificate 에러 패턴이 일치합니다. 인증서 만료 일시를 즉시 확인하세요.",
    ],
    "rb-006": [
        "Kafka 컨슈머 랙이 급격히 증가하는 패턴이 감지되었습니다. 처리량 저하 또는 컨슈머 장애가 원인일 수 있습니다.",
        "컨슈머 그룹 처리 지연 패턴이 일치합니다. 스케일아웃을 즉시 검토해야 합니다.",
    ],
}

SUMMARIES: dict[str, str] = {
    "rb-001": "DB 커넥션 풀 고갈로 인한 서비스 응답 불가 장애",
    "rb-002": "API 서버 5xx 에러 급증 — 배포 또는 의존 서비스 이상",
    "rb-003": "Redis OOM으로 인한 캐시/세션 서비스 장애",
    "rb-004": "디스크 용량 고갈로 인한 파일 쓰기 실패",
    "rb-005": "SSL 인증서 만료로 인한 HTTPS 연결 불가",
    "rb-006": "Kafka 컨슈머 랙 급증으로 인한 메시지 처리 지연",
}


def _score(text: str, keywords: list[str]) -> int:
    lower = text.lower()
    return sum(lower.count(kw.lower()) for kw in keywords)


def match_runbooks(text: str, db: Session) -> list[MatchResult]:
    runbooks = db.query(Runbook).all()
    scored: list[tuple[int, Runbook]] = []

    for rb in runbooks:
        keywords = RUNBOOK_KEYWORDS.get(rb.id, rb.tags or [])
        # Also score against title + description
        search_text = text + " " + rb.title + " " + rb.description
        score = _score(search_text, keywords)
        if score > 0:
            scored.append((score, rb))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:3] if scored else [(0, rb) for rb in runbooks[:3]]

    if not top:
        return []

    max_score = top[0][0] if top[0][0] > 0 else 1
    results: list[MatchResult] = []

    for idx, (score, rb) in enumerate(top):
        base = [92, 71, 54][idx] if idx < 3 else 40
        confidence = min(95, round(base * (score / max_score))) if score > 0 else base - idx * 15
        reasonings = REASONINGS.get(rb.id, ["해당 패턴과 일치하는 에러가 감지되었습니다."])
        results.append(MatchResult(
            runbookId=rb.id,
            confidence=max(10, confidence),
            reasoning=reasonings[idx % len(reasonings)],
        ))

    return results


def find_similar_incidents(text: str, db: Session, limit: int = 5) -> list[str]:
    incidents = db.query(Incident).all()
    scored: list[tuple[int, Incident]] = []

    for inc in incidents:
        search = f"{inc.symptom} {inc.cause} {inc.resolution}".lower()
        score = sum(search.count(word.lower()) for word in text.lower().split() if len(word) > 2)
        if score > 0:
            scored.append((score, inc))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [inc.id for _, inc in scored[:limit]]
