import { Clock, CheckCircle2, Timer } from 'lucide-react';
import type { TimelineEntry } from '../types';

interface TimelineProps {
  entries: TimelineEntry[];
  startTime?: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getDurationMinutes(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

export default function Timeline({ entries, startTime }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock size={24} className="text-slate-700 mx-auto mb-2" />
        <p className="text-xs text-slate-500">체크리스트를 완료하면 타임라인이 자동으로 기록됩니다</p>
      </div>
    );
  }

  const totalDuration = startTime && entries.length > 0
    ? getDurationMinutes(startTime, entries[entries.length - 1].timestamp)
    : null;

  return (
    <div>
      {/* Summary */}
      {totalDuration !== null && (
        <div className="flex items-center gap-2 mb-4 bg-slate-800/50 rounded-xl px-4 py-2.5">
          <Timer size={14} className="text-orange-400" />
          <span className="text-xs text-slate-300">
            총 대응 시간: <span className="font-bold text-orange-400">{totalDuration}분</span>
          </span>
          <span className="text-slate-600 mx-1">·</span>
          <span className="text-xs text-slate-400">{entries.length}단계 완료</span>
        </div>
      )}

      {/* Timeline entries */}
      <div className="relative">
        <div className="absolute left-[18px] top-5 bottom-0 w-px bg-slate-800" />
        <div className="space-y-3">
          {entries.map((entry, idx) => (
            <div key={entry.id} className="flex items-start gap-3 relative">
              <div className="w-9 h-9 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 z-10">
                <CheckCircle2 size={14} className="text-green-400" />
              </div>
              <div className="flex-1 bg-slate-800/40 rounded-xl px-3 py-2.5 border border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-xs font-medium text-slate-100">{entry.stepTitle}</span>
                  <span className="text-xs text-slate-500 shrink-0">{formatTime(entry.timestamp)}</span>
                </div>
                {idx > 0 && (
                  <span className="text-xs text-slate-500">
                    +{getDurationMinutes(entries[idx - 1].timestamp, entry.timestamp)}분 경과
                  </span>
                )}
                {idx === 0 && startTime && (
                  <span className="text-xs text-slate-500">
                    시작 후 {getDurationMinutes(startTime, entry.timestamp)}분
                  </span>
                )}
                {entry.note && (
                  <p className="text-xs text-slate-400 mt-1">{entry.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
