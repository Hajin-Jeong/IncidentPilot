import { useState } from 'react';
import { ArrowLeft, BookOpen, History, GitCommitHorizontal, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import type { AnalysisResult, ChecklistItem, TimelineEntry } from '../types';
import RunbookList from './RunbookList';
import Checklist from './Checklist';
import PastIncidents from './PastIncidents';
import Timeline from './Timeline';

interface AnalysisViewProps {
  result: AnalysisResult;
  inputSummary: string;
  onBack: () => void;
}

export default function AnalysisView({ result, inputSummary, onBack }: AnalysisViewProps) {
  const [selectedRunbookId, setSelectedRunbookId] = useState<string | null>(
    result.matches[0]?.runbook.id ?? null
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [startTime] = useState(new Date().toISOString());
  const [rightPanel, setRightPanel] = useState<'incidents' | 'timeline'>('incidents');

  const selectedMatch = result.matches.find((m) => m.runbook.id === selectedRunbookId);

  const handleSelectRunbook = (id: string) => {
    setSelectedRunbookId(id);
    setChecklist([]);
    setTimeline([]);
  };

  const handleToggleStep = (stepId: string, entry: TimelineEntry) => {
    setChecklist((prev) => {
      const existing = prev.find((c) => c.stepId === stepId);
      if (existing) {
        return prev.map((c) =>
          c.stepId === stepId ? { ...c, completed: !c.completed, completedAt: !c.completed ? new Date().toISOString() : undefined } : c
        );
      }
      return [...prev, { stepId, completed: true, completedAt: new Date().toISOString() }];
    });

    // Add to timeline only when completing (not unchecking)
    const existing = checklist.find((c) => c.stepId === stepId);
    if (!existing || !existing.completed) {
      setTimeline((prev) => [...prev, entry]);
      setRightPanel('timeline');
    } else {
      setTimeline((prev) => prev.filter((e) => !e.id.startsWith(stepId)));
    }
  };

  return (
    <div>
      {/* Back button + summary */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl shrink-0"
        >
          <ArrowLeft size={15} />
          처음으로
        </button>
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex-1">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-yellow-400" />
            <span className="text-xs font-medium text-slate-300">AI 분석 결과</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{result.summary || inputSummary}</p>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-[300px_1fr_320px] gap-4 items-start">
        {/* Left: Runbook matches */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={14} className="text-red-400" />
            <h2 className="text-sm font-semibold text-slate-200">런북 매칭</h2>
            <span className="ml-auto text-xs bg-red-400/10 text-red-400 px-2 py-0.5 rounded-full font-medium">
              {result.matches.length}개
            </span>
          </div>
          <RunbookList
            matches={result.matches}
            selectedId={selectedRunbookId}
            onSelect={handleSelectRunbook}
            extractedErrors={result.extractedErrors}
          />
        </div>

        {/* Center: Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          {selectedMatch ? (
            <Checklist
              runbook={selectedMatch.runbook}
              checklist={checklist}
              onToggle={handleToggleStep}
            />
          ) : (
            <div className="text-center py-12">
              <BookOpen size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">좌측에서 런북을 선택하면<br />체크리스트가 표시됩니다</p>
            </div>
          )}
        </div>

        {/* Right: Past incidents + Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Panel switcher */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setRightPanel('incidents')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-medium transition-colors',
                rightPanel === 'incidents'
                  ? 'text-white border-b-2 border-red-400 bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <History size={13} />
              유사 과거 장애
            </button>
            <button
              onClick={() => setRightPanel('timeline')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-medium transition-colors',
                rightPanel === 'timeline'
                  ? 'text-white border-b-2 border-red-400 bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <GitCommitHorizontal size={13} />
              대응 타임라인
              {timeline.length > 0 && (
                <span className="bg-red-400 text-white text-xs px-1.5 rounded-full leading-none py-0.5">
                  {timeline.length}
                </span>
              )}
            </button>
          </div>
          <div className="p-5">
            {rightPanel === 'incidents' ? (
              <PastIncidents incidents={result.similarIncidents} />
            ) : (
              <Timeline entries={timeline} startTime={startTime} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
