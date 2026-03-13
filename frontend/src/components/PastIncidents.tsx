import { TrendingUp, Clock, Calendar, Lightbulb } from 'lucide-react';
import clsx from 'clsx';
import type { Incident } from '../types';
import { getInsightMessage } from '../services/incidentMatcher';

interface PastIncidentsProps {
  incidents: Incident[];
}

const severityColors: Record<string, string> = {
  P1: 'text-red-400 bg-red-400/10',
  P2: 'text-orange-400 bg-orange-400/10',
  P3: 'text-yellow-400 bg-yellow-400/10',
  P4: 'text-blue-400 bg-blue-400/10',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function PastIncidents({ incidents }: PastIncidentsProps) {
  const insight = getInsightMessage(incidents);

  if (incidents.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp size={24} className="text-slate-700 mx-auto mb-2" />
        <p className="text-xs text-slate-500">유사한 과거 장애 이력이 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      {/* Insight */}
      <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 mb-4">
        <Lightbulb size={14} className="text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-300/80 leading-relaxed">{insight}</p>
      </div>

      {/* List */}
      <div className="space-y-3">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={clsx('text-xs font-bold px-1.5 py-0.5 rounded-md', severityColors[incident.severity])}>
                    {incident.severity}
                  </span>
                  <span className="text-xs font-medium text-slate-300 truncate">{incident.service}</span>
                  <span className="text-xs text-slate-500 ml-auto flex items-center gap-1 shrink-0">
                    <Calendar size={10} />
                    {formatDate(incident.date)}
                  </span>
                </div>

                {/* Symptom */}
                <p className="text-xs text-slate-300 mb-2 leading-relaxed">{incident.symptom}</p>

                {/* Cause & Resolution */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-slate-500 shrink-0 w-8">원인</span>
                    <p className="text-xs text-slate-400 leading-relaxed">{incident.cause}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-slate-500 shrink-0 w-8">해결</span>
                    <p className="text-xs text-slate-400 leading-relaxed">{incident.resolution}</p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1.5 mt-2">
                  <Clock size={11} className="text-slate-600" />
                  <span className="text-xs text-slate-500">해결 시간: <span className="text-slate-400 font-medium">{incident.durationMinutes}분</span></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
