import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, Terminal, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import type { Runbook, ChecklistItem, TimelineEntry } from '../types';

interface ChecklistProps {
  runbook: Runbook;
  checklist: ChecklistItem[];
  onToggle: (stepId: string, entry: TimelineEntry) => void;
}

export default function Checklist({ runbook, checklist, onToggle }: ChecklistProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // Auto-expand first incomplete step
  useEffect(() => {
    const firstIncomplete = runbook.steps.find(
      (step) => !checklist.find((c) => c.stepId === step.id)?.completed
    );
    if (firstIncomplete) {
      setExpandedSteps(new Set([firstIncomplete.id]));
    }
  }, [runbook.id]);

  const toggleExpand = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const completedCount = checklist.filter((c) => c.completed).length;
  const totalCount = runbook.steps.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const totalMinutes = runbook.steps.reduce((s, step) => s + step.estimatedMinutes, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-red-400" />
            <h3 className="font-semibold text-slate-100">{runbook.title}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock size={12} />
            <span>예상 {totalMinutes}분</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-3 leading-relaxed">{runbook.description}</p>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">
              {completedCount}/{totalCount} 단계 완료
            </span>
            <span className={clsx(
              'font-medium',
              progressPct === 100 ? 'text-green-400' : 'text-slate-300'
            )}>
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {runbook.steps.map((step, idx) => {
          const checkItem = checklist.find((c) => c.stepId === step.id);
          const isCompleted = checkItem?.completed ?? false;
          const isExpanded = expandedSteps.has(step.id);
          const isActive = !isCompleted && idx === checklist.filter((c) => c.completed).length;

          return (
            <div
              key={step.id}
              className={clsx(
                'rounded-xl border transition-all',
                isCompleted
                  ? 'bg-green-950/20 border-green-500/20'
                  : isActive
                  ? 'bg-slate-800/60 border-red-400/30 shadow-sm shadow-red-500/5'
                  : 'bg-slate-900/50 border-slate-800'
              )}
            >
              {/* Step header */}
              <div className="flex items-center gap-3 p-3">
                <button
                  onClick={() => {
                    const entry: TimelineEntry = {
                      id: `${step.id}-${Date.now()}`,
                      timestamp: new Date().toISOString(),
                      stepTitle: step.title,
                    };
                    onToggle(step.id, entry);
                  }}
                  className="shrink-0 transition-transform hover:scale-110"
                >
                  {isCompleted ? (
                    <CheckCircle2 size={20} className="text-green-400" />
                  ) : (
                    <Circle size={20} className={isActive ? 'text-red-400' : 'text-slate-600'} />
                  )}
                </button>

                <div className="flex-1 min-w-0" onClick={() => toggleExpand(step.id)}>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <span className={clsx(
                      'text-xs font-bold w-5 shrink-0',
                      isActive ? 'text-red-400' : 'text-slate-500'
                    )}>
                      {step.order}
                    </span>
                    <span className={clsx(
                      'text-sm font-medium truncate',
                      isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                    )}>
                      {step.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={10} />
                    {step.estimatedMinutes}m
                  </span>
                  <button
                    onClick={() => toggleExpand(step.id)}
                    className="text-slate-600 hover:text-slate-400"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-800/50">
                  <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>

                  {step.commands && step.commands.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Terminal size={11} className="text-slate-500" />
                        <span className="text-xs text-slate-500 font-medium">명령어</span>
                      </div>
                      <div className="space-y-1.5">
                        {step.commands.map((cmd, i) => (
                          <code
                            key={i}
                            className="block text-xs font-mono bg-slate-950 text-green-300 px-3 py-2 rounded-lg break-all"
                          >
                            {cmd}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {step.notes && (
                    <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2">
                      <span className="text-yellow-400 text-xs">⚠</span>
                      <p className="text-xs text-yellow-300/70">{step.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
