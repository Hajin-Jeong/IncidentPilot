import { ArrowRight, Tag, ListChecks, Clock } from 'lucide-react';
import clsx from 'clsx';
import type { Runbook } from '../types';

interface RunbookCatalogProps {
  runbooks: Runbook[];
  onSelect: (runbook: Runbook) => void;
}

const severityConfig = {
  P1: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  P2: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  P3: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  P4: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
};

export default function RunbookCatalog({ runbooks, onSelect }: RunbookCatalogProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-200">런북 카탈로그</h2>
        <span className="text-xs text-slate-500">유형을 알고 있다면 바로 시작하세요</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {runbooks.map((rb) => {
          const sev = severityConfig[rb.severity];
          const totalMinutes = rb.steps.reduce((s, step) => s + step.estimatedMinutes, 0);

          return (
            <button
              key={rb.id}
              onClick={() => onSelect(rb)}
              className="group text-left bg-slate-900 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/60 hover:border-slate-600 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <span
                  className={clsx(
                    'text-xs font-bold px-2 py-0.5 rounded-md border',
                    sev.color, sev.bg, sev.border
                  )}
                >
                  {rb.severity}
                </span>
                <ArrowRight
                  size={14}
                  className="text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
                />
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-slate-100 mb-2 leading-snug">
                {rb.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
                {rb.description}
              </p>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <ListChecks size={11} />
                  {rb.steps.length}단계
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {totalMinutes}분
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-3">
                {rb.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md"
                  >
                    <Tag size={9} />
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
