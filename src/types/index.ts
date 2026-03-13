export interface RunbookStep {
  id: string;
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  commands?: string[];
  notes?: string;
}

export interface Runbook {
  id: string;
  title: string;
  description: string;
  tags: string[];
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  steps: RunbookStep[];
}

export interface Incident {
  id: string;
  date: string;
  service: string;
  symptom: string;
  cause: string;
  resolution: string;
  durationMinutes: number;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  relatedRunbookId: string;
}

export interface MatchResult {
  runbook: Runbook;
  confidence: number;
  reasoning: string;
  rank: number;
}

export interface ChecklistItem {
  stepId: string;
  completed: boolean;
  completedAt?: string;
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  stepTitle: string;
  note?: string;
}

export interface AnalysisResult {
  matches: MatchResult[];
  similarIncidents: Incident[];
  extractedErrors?: string[];
  summary?: string;
}

export type ViewMode = 'dashboard' | 'analysis';
export type InputTab = 'file' | 'text';
