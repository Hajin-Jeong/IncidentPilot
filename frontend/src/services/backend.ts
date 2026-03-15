import type { MatchResult, Incident } from '../types';
import type { Runbook } from '../types';
import runbooksData from '../data/runbooks.json';
import incidentsData from '../data/incidents.json';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const runbooks = runbooksData as Runbook[];
const incidents = incidentsData as Incident[];

interface BackendAnalyzeResponse {
  matches: { runbookId: string; confidence: number; reasoning: string }[];
  extractedErrors: string[];
  summary: string;
  similarIncidentIds: string[];
}

export async function backendAnalyzeIncident(input: string): Promise<{
  matches: MatchResult[];
  extractedErrors: string[];
  summary: string;
  similarIncidents: Incident[];
}> {
  const response = await fetch(`${BACKEND_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input }),
  });

  if (!response.ok) {
    throw new Error(`백엔드 API 오류: ${response.status} ${response.statusText}`);
  }

  const data: BackendAnalyzeResponse = await response.json();

  // Map runbook IDs → full Runbook objects
  const matches: MatchResult[] = data.matches
    .map((m, idx) => {
      const runbook = runbooks.find((rb) => rb.id === m.runbookId);
      if (!runbook) return null;
      return {
        runbook,
        confidence: m.confidence,
        reasoning: m.reasoning,
        rank: idx + 1,
      };
    })
    .filter((m): m is MatchResult => m !== null);

  // Map incident IDs → full Incident objects
  const similarIncidents: Incident[] = data.similarIncidentIds
    .map((id) => incidents.find((inc) => inc.id === id))
    .filter((inc): inc is Incident => inc !== undefined);

  return {
    matches,
    extractedErrors: data.extractedErrors,
    summary: data.summary,
    similarIncidents,
  };
}
