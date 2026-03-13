import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import clsx from 'clsx';
import Layout from './components/Layout';
import IncidentInput from './components/IncidentInput';
import RecentIncidents from './components/RecentIncidents';
import AnalysisView from './components/AnalysisView';
import StatsBar from './components/StatsBar';
import RunbookCatalog from './components/RunbookCatalog';
import type { AnalysisResult, ViewMode } from './types';
import type { Runbook, Incident } from './types';
import { analyzeIncident, findSimilarIncidents } from './services/claude';
import { mockAnalyzeIncident, mockFindSimilarIncidents } from './services/mock';
import { keywordMatchIncidents } from './services/incidentMatcher';
import incidentsData from './data/incidents.json';
import runbooksData from './data/runbooks.json';

const incidents = incidentsData as Incident[];
const runbooks = runbooksData as Runbook[];

export default function App() {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [inputSummary, setInputSummary] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);

  const handleAnalyze = async (input: string, fileName?: string) => {
    setIsLoading(true);
    setError(null);
    setInputSummary(fileName ? `파일: ${fileName}` : input.slice(0, 80) + (input.length > 80 ? '...' : ''));

    try {
      let aiResult, similarIncidents;

      if (mockMode) {
        [aiResult, similarIncidents] = await Promise.all([
          mockAnalyzeIncident(input),
          Promise.resolve(mockFindSimilarIncidents(input, incidents)),
        ]);
      } else {
        [aiResult, similarIncidents] = await Promise.all([
          analyzeIncident(input),
          findSimilarIncidents(input, incidents).catch(() => mockFindSimilarIncidents(input, incidents)),
        ]);
      }

      setAnalysisResult({
        matches: aiResult.matches,
        extractedErrors: aiResult.extractedErrors,
        summary: aiResult.summary,
        similarIncidents,
      });
      setView('analysis');
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct runbook selection from catalog — skip AI analysis
  const handleDirectRunbook = (runbook: Runbook) => {
    const similar = keywordMatchIncidents(
      runbook.tags.join(' ') + ' ' + runbook.description,
      incidents
    );
    setAnalysisResult({
      matches: [{ runbook, confidence: 100, reasoning: '런북 카탈로그에서 직접 선택했습니다.', rank: 1 }],
      extractedErrors: [],
      summary: `${runbook.title} — 직접 선택`,
      similarIncidents: similar,
    });
    setInputSummary(`런북 직접 선택: ${runbook.title}`);
    setView('analysis');
  };

  const handleBack = () => {
    setView('dashboard');
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <Layout>
      {view === 'dashboard' && (
        <div className="space-y-8">
          {/* Top section: input + recent incidents */}
          <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
            <div>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    장애를 빠르게 진단하고 대응하세요
                  </h1>
                  <p className="text-sm text-slate-400">
                    로그 파일 또는 증상을 입력하면 AI가 최적의 런북을 매칭하고 체크리스트 대응 가이드를 제공합니다.
                  </p>
                </div>
                <button
                  onClick={() => setMockMode((v) => !v)}
                  className={clsx(
                    'shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                    mockMode
                      ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  )}
                >
                  <FlaskConical size={13} />
                  Mock 모드 {mockMode ? 'ON' : 'OFF'}
                </button>
              </div>

              <IncidentInput onAnalyze={handleAnalyze} isLoading={isLoading} />

              {error && (
                <div className="mt-4 bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-300">{error}</p>
                  <p className="text-xs text-red-400/60 mt-1">
                    Mock 모드를 켜면 API 없이도 데모할 수 있습니다.
                  </p>
                </div>
              )}
            </div>

            <RecentIncidents incidents={incidents} />
          </div>

          {/* Stats bar */}
          <StatsBar incidents={incidents} runbookCount={runbooks.length} />

          {/* Runbook catalog */}
          <RunbookCatalog runbooks={runbooks} onSelect={handleDirectRunbook} />
        </div>
      )}

      {view === 'analysis' && analysisResult && (
        <AnalysisView
          result={analysisResult}
          inputSummary={inputSummary}
          onBack={handleBack}
        />
      )}
    </Layout>
  );
}
