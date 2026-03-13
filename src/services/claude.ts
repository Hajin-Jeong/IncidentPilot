import type { Runbook, MatchResult, Incident } from '../types';
import runbooks from '../data/runbooks.json';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function callClaude(messages: ClaudeMessage[], systemPrompt?: string): Promise<string> {
  if (!CLAUDE_API_KEY) {
    throw new Error('VITE_CLAUDE_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`Claude API 오류: ${error?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function analyzeIncident(input: string): Promise<{
  matches: MatchResult[];
  extractedErrors: string[];
  summary: string;
}> {
  const runbookSummary = (runbooks as Runbook[]).map((rb) => ({
    id: rb.id,
    title: rb.title,
    description: rb.description,
    tags: rb.tags,
    severity: rb.severity,
  }));

  const systemPrompt = `당신은 IT 인프라 장애 대응 전문가입니다. 장애 로그나 증상을 분석하여 가장 적합한 런북을 매칭하고, 핵심 에러를 추출합니다.

응답은 반드시 다음 JSON 형식으로만 답하세요:
{
  "matches": [
    {
      "runbookId": "런북 ID",
      "confidence": 85,
      "reasoning": "매칭 근거 설명 (한국어, 2-3문장)"
    }
  ],
  "extractedErrors": ["에러 메시지 1", "에러 메시지 2"],
  "summary": "장애 상황 한줄 요약 (한국어)"
}

- matches는 최대 3개, 신뢰도 높은 순으로 정렬
- confidence는 0-100 정수
- extractedErrors는 핵심 에러 메시지 최대 5개`;

  const userMessage = `다음은 사용 가능한 런북 목록입니다:
${JSON.stringify(runbookSummary, null, 2)}

---

분석할 장애 내용:
${input}

위 장애에 가장 적합한 런북을 매칭하고 핵심 에러를 추출해주세요.`;

  const responseText = await callClaude([{ role: 'user', content: userMessage }], systemPrompt);

  try {
    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');

    const parsed = JSON.parse(jsonMatch[0]);

    const matches: MatchResult[] = parsed.matches
      .map((m: { runbookId: string; confidence: number; reasoning: string }, idx: number) => {
        const runbook = (runbooks as Runbook[]).find((rb) => rb.id === m.runbookId);
        if (!runbook) return null;
        return {
          runbook,
          confidence: m.confidence,
          reasoning: m.reasoning,
          rank: idx + 1,
        };
      })
      .filter(Boolean) as MatchResult[];

    return {
      matches,
      extractedErrors: parsed.extractedErrors || [],
      summary: parsed.summary || '분석 완료',
    };
  } catch {
    throw new Error('AI 응답 파싱에 실패했습니다. 다시 시도해주세요.');
  }
}

export async function findSimilarIncidents(
  input: string,
  incidents: Incident[]
): Promise<Incident[]> {
  const incidentSummary = incidents.map((inc) => ({
    id: inc.id,
    service: inc.service,
    symptom: inc.symptom,
    cause: inc.cause,
    severity: inc.severity,
  }));

  const systemPrompt = `당신은 IT 장애 분석 전문가입니다. 현재 장애와 과거 장애 이력을 비교하여 유사한 사례를 찾습니다.

응답은 반드시 다음 JSON 형식으로만 답하세요:
{
  "similarIncidentIds": ["inc-001", "inc-003"]
}

- 유사도가 높은 순서대로 최대 5개
- 명확히 관련없는 항목은 제외`;

  const userMessage = `현재 장애 내용:
${input}

---

과거 장애 이력:
${JSON.stringify(incidentSummary, null, 2)}

유사한 과거 장애 ID를 반환해주세요.`;

  try {
    const responseText = await callClaude([{ role: 'user', content: userMessage }], systemPrompt);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    const ids: string[] = parsed.similarIncidentIds || [];

    return ids
      .map((id) => incidents.find((inc) => inc.id === id))
      .filter(Boolean) as Incident[];
  } catch {
    return [];
  }
}
