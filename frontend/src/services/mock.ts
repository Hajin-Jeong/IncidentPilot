import type { MatchResult, Incident } from '../types';
import runbooks from '../data/runbooks.json';
import type { Runbook } from '../types';

// Keyword rules for matching runbooks
const RULES: { id: string; keywords: string[]; weight: number }[] = [
  { id: 'rb-001', keywords: ['hikari', 'connection pool', 'jdbc', 'pool exhausted', 'pool stats', 'connectiontimeout', '커넥션'], weight: 3 },
  { id: 'rb-002', keywords: ['5xx', '500', '503', 'server error', 'badgrammar', 'rollback', 'migration', 'stacktrace', 'exception', 'deploy'], weight: 2 },
  { id: 'rb-003', keywords: ['redis', 'oom', 'out of memory', 'maxmemory', 'jedis', 'eviction', '메모리'], weight: 3 },
  { id: 'rb-004', keywords: ['disk', 'no space', 'filesystem', '/tmp', 'logrotate', '디스크', '용량'], weight: 3 },
  { id: 'rb-005', keywords: ['ssl', 'tls', 'certificate', 'cert', 'x509', 'expired', '인증서'], weight: 3 },
  { id: 'rb-006', keywords: ['kafka', 'consumer', 'lag', 'offset', 'partition', '랙', '컨슈머'], weight: 3 },
];

const REASONINGS: Record<string, string[]> = {
  'rb-001': [
    'HikariPool 관련 에러 메시지가 다수 감지되었습니다. 커넥션 풀이 완전히 소진(active=max, idle=0)된 상태이며, 대기 중인 요청이 급증하고 있습니다.',
    'DB 커넥션 타임아웃 에러 패턴이 일치합니다. 풀 크기 설정 오류 또는 커넥션 누수가 원인일 가능성이 높습니다.',
    'JDBC Connection 획득 실패 로그가 반복 발생하고 있습니다. 커넥션 풀 고갈 대응 런북을 즉시 적용하세요.',
  ],
  'rb-002': [
    '배포 직후부터 5xx 에러가 급증하는 패턴이 감지되었습니다. DB 스키마 불일치 또는 코드 버그가 원인일 가능성이 높습니다.',
    'HTTP 500/503 에러와 스택트레이스가 다수 감지되었습니다. 최근 배포와 연관성을 즉시 확인해야 합니다.',
    'API 에러율이 급격히 상승했습니다. 롤백 여부 판단을 위해 배포 이력을 먼저 확인하세요.',
  ],
  'rb-003': [
    'Redis OOM(Out of Memory) 에러가 감지되었습니다. maxmemory 한도를 초과하여 신규 키 저장이 불가능한 상태입니다.',
    'Redis 메모리 사용량이 임계치를 초과했습니다. TTL 미설정 키 또는 대용량 키가 원인일 가능성이 높습니다.',
    'JedisDataException OOM 패턴이 일치합니다. 즉시 불필요한 키를 삭제하고 eviction policy를 설정해야 합니다.',
  ],
  'rb-004': [
    '디스크 사용량 초과 관련 에러가 감지되었습니다. 로그 파일 누적 또는 임시 파일 정리 실패가 원인일 수 있습니다.',
    'No space left on device 패턴이 일치합니다. 즉시 불필요한 파일을 삭제해야 합니다.',
    '파일 시스템 용량 고갈이 감지되었습니다. 로그 로테이션 설정을 확인하세요.',
  ],
  'rb-005': [
    'SSL/TLS 인증서 관련 에러가 감지되었습니다. 인증서 만료 또는 자동 갱신 실패가 원인일 수 있습니다.',
    'x509 certificate 에러 패턴이 일치합니다. 인증서 만료 일시를 즉시 확인해야 합니다.',
    'HTTPS 연결 실패 패턴이 감지되었습니다. cert-manager 상태를 확인하세요.',
  ],
  'rb-006': [
    'Kafka 컨슈머 랙이 급격히 증가하는 패턴이 감지되었습니다. 처리량 저하 또는 컨슈머 장애가 원인일 수 있습니다.',
    '컨슈머 그룹 처리 지연 패턴이 일치합니다. 스케일아웃을 즉시 검토해야 합니다.',
    'Kafka 오프셋 지연 로그가 다수 감지되었습니다. 처리 병목 구간을 분석하세요.',
  ],
};

const ERROR_PATTERNS: Record<string, string[]> = {
  'rb-001': [
    'HikariPool-1 - Connection is not available, request timed out after 30000ms',
    'Pool stats (total=10, active=10, idle=0, waiting=45)',
    'Unable to acquire JDBC Connection',
  ],
  'rb-002': [
    'Column not found in result set',
    'HTTP 500 Internal Server Error',
    'SchemaValidationException: Migration not executed',
  ],
  'rb-003': [
    'OOM command not allowed when used memory > maxmemory',
    'Redis memory usage: 95%',
    'JedisDataException: OOM',
  ],
  'rb-004': [
    'No space left on device',
    'Disk usage: 95%',
    'Failed to write log: filesystem full',
  ],
  'rb-005': [
    'SSL certificate has expired',
    'x509: certificate signed by unknown authority',
    'TLS handshake failure',
  ],
  'rb-006': [
    'Consumer lag exceeds threshold: 50000',
    'Consumer group rebalancing detected',
    'Kafka offset commit failed',
  ],
};

const SUMMARIES: Record<string, string> = {
  'rb-001': 'DB 커넥션 풀 고갈로 인한 서비스 응답 불가 장애',
  'rb-002': 'API 서버 5xx 에러 급증 — 배포 또는 의존 서비스 이상',
  'rb-003': 'Redis OOM으로 인한 캐시/세션 서비스 장애',
  'rb-004': '디스크 용량 고갈로 인한 파일 쓰기 실패',
  'rb-005': 'SSL 인증서 만료로 인한 HTTPS 연결 불가',
  'rb-006': 'Kafka 컨슈머 랙 급증으로 인한 메시지 처리 지연',
};

function scoreInput(input: string): { id: string; score: number }[] {
  const lower = input.toLowerCase();
  return RULES.map(({ id, keywords, weight }) => {
    const score = keywords.reduce((s, kw) => {
      const count = (lower.match(new RegExp(kw, 'gi')) || []).length;
      return s + count * weight;
    }, 0);
    return { id, score };
  }).sort((a, b) => b.score - a.score);
}

function pickReasoning(id: string, idx: number): string {
  const list = REASONINGS[id] || ['해당 패턴과 일치하는 에러가 감지되었습니다.'];
  return list[idx % list.length];
}

function extractErrors(input: string, topId: string): string[] {
  // Try to extract real error lines from input
  const errorLines = input
    .split('\n')
    .filter((line) => /error|exception|oom|fatal|failed/i.test(line))
    .slice(0, 3)
    .map((line) => line.trim().slice(0, 120));

  if (errorLines.length > 0) return errorLines;
  return (ERROR_PATTERNS[topId] || []).slice(0, 3);
}

export async function mockAnalyzeIncident(input: string): Promise<{
  matches: MatchResult[];
  extractedErrors: string[];
  summary: string;
}> {
  // Simulate API delay
  await new Promise((r) => setTimeout(r, 1200));

  const scores = scoreInput(input);
  const top3 = scores.filter((s) => s.score > 0).slice(0, 3);

  // If no keyword match, default to top 2 runbooks
  const candidates = top3.length > 0 ? top3 : scores.slice(0, 2);

  const maxScore = candidates[0]?.score || 1;

  const matches: MatchResult[] = candidates.map((s, idx) => {
    const runbook = (runbooks as Runbook[]).find((rb) => rb.id === s.id)!;
    // Scale confidence: top match 88-95%, others lower
    const base = idx === 0 ? 92 : idx === 1 ? 71 : 54;
    const confidence = top3.length > 0
      ? Math.min(95, Math.round(base * (s.score / maxScore) + (idx === 0 ? 0 : -5)))
      : base - idx * 15;
    return {
      runbook,
      confidence,
      reasoning: pickReasoning(s.id, idx),
      rank: idx + 1,
    };
  });

  const topId = candidates[0]?.id || 'rb-002';

  return {
    matches,
    extractedErrors: extractErrors(input, topId),
    summary: SUMMARIES[topId] || '장애 패턴 분석 완료 (Mock 모드)',
  };
}

export function mockFindSimilarIncidents(input: string, incidents: Incident[]): Incident[] {
  const scores = scoreInput(input);
  const topId = scores[0]?.id;
  if (!topId) return incidents.slice(0, 3);

  // Return incidents related to top matched runbook first
  const related = incidents.filter((inc) => inc.relatedRunbookId === topId);
  const others = incidents.filter((inc) => inc.relatedRunbookId !== topId).slice(0, 2);
  return [...related, ...others].slice(0, 5);
}
