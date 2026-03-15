import { Trophy, Target, AlertCircle, ChevronRight, Tag } from 'lucide-react';
import clsx from 'clsx';
import type { MatchResult } from '../types';

interface RunbookListProps {
  matches: MatchResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  extractedErrors?: string[];
}

const rankConfig = [
  { medal: '🥇', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', color: 'text-yellow-400' },
  { medal: '🥈', bg: 'bg-slate-500/10', border: 'border-slate-500/30', color: 'text-slate-400' },
  { medal: '🥉', bg: 'bg-orange-700/10', border: 'border-orange-700/30', color: 'text-orange-600' },
];

function ConfidenceBadge({ value }: { value: number }) {
  const color = value >= 80 ? 'text-green-400' : value >= 60 ? 'text-yellow-400' : 'text-slate-400';
  const bg = value >= 80 ? 'bg-green-400/10' : value >= 60 ? 'bg-yellow-400/10' : 'bg-slate-700';
  return (
    <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', color, bg)}>
      {value}%
    </span>
  );
}

export default function RunbookList({ matches, selectedId, onSelect, extractedErrors }: RunbookListProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Extracted Errors */}
      {extractedErrors && extractedErrors.length > 0 && (
        <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-red-400" />
            <span className="text-xs font-semibold text-red-400">AI 추출 핵심 에러</span>
          </div>
          <ul className="space-y-1.5">
            {extractedErrors.map((err, i) => (
              <li key={i} className="text-xs font-mono text-red-300/80 bg-red-950/40 px-3 py-1.5 rounded-lg break-all overflow-hidden">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Matched Runbooks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={14} className="text-yellow-500" />
          <span className="text-xs font-semibold text-slate-300">매칭된 런북</span>
        </div>
        <div className="space-y-3">
          {matches.map((match) => {
            const cfg = rankConfig[match.rank - 1] || rankConfig[2];
            const isSelected = selectedId === match.runbook.id;
            return (
              <button
                key={match.runbook.id}
                onClick={() => onSelect(match.runbook.id)}
                className={clsx(
                  'w-full text-left rounded-xl border p-4 transition-all',
                  isSelected
                    ? 'bg-slate-700/60 border-red-400/50 shadow-md shadow-red-500/10'
                    : `${cfg.bg} ${cfg.border} hover:bg-slate-800/60 hover:border-slate-600`
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cfg.medal}</span>
                    <span className="text-sm font-semibold text-slate-100 leading-tight">
                      {match.runbook.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <ConfidenceBadge value={match.confidence} />
                    {isSelected && <ChevronRight size={14} className="text-red-400" />}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {match.reasoning}
                </p>

                <div className="flex items-start gap-2">
                  <Target size={12} className="text-slate-500 mt-0.5 shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {match.runbook.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md"
                      >
                        <Tag size={9} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
