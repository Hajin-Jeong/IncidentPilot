import type { Incident } from '../types';

// Keyword-based fallback matcher for when Claude API is unavailable
export function keywordMatchIncidents(input: string, incidents: Incident[]): Incident[] {
  const lowerInput = input.toLowerCase();

  const scored = incidents.map((inc) => {
    const text = `${inc.symptom} ${inc.cause} ${inc.resolution}`.toLowerCase();
    const words = text.split(/\s+/);
    const inputWords = lowerInput.split(/\s+/);

    let score = 0;
    for (const word of inputWords) {
      if (word.length > 2 && words.some((w) => w.includes(word))) {
        score++;
      }
    }
    return { incident: inc, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.incident);
}

export function getInsightMessage(incidents: Incident[]): string {
  if (incidents.length === 0) return '유사한 과거 장애 이력이 없습니다.';

  const avgDuration = Math.round(
    incidents.reduce((sum, inc) => sum + inc.durationMinutes, 0) / incidents.length
  );

  const p1Count = incidents.filter((inc) => inc.severity === 'P1').length;
  const severityText = p1Count > 0 ? `P1 장애 ${p1Count}건 포함, ` : '';

  return `유사 장애 ${incidents.length}건 발견 — ${severityText}평균 해결시간 ${avgDuration}분`;
}
