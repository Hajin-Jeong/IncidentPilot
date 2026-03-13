import { AlertOctagon, Clock, TrendingDown, BookMarked } from 'lucide-react';
import type { Incident } from '../types';

interface StatsBarProps {
  incidents: Incident[];
  runbookCount: number;
}

export default function StatsBar({ incidents, runbookCount }: StatsBarProps) {
  const totalCount = incidents.length;
  const avgDuration = Math.round(
    incidents.reduce((s, i) => s + i.durationMinutes, 0) / totalCount
  );
  const p1Count = incidents.filter((i) => i.severity === 'P1').length;

  // Most frequent service
  const serviceCounts = incidents.reduce<Record<string, number>>((acc, i) => {
    acc[i.service] = (acc[i.service] || 0) + 1;
    return acc;
  }, {});
  const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];

  const stats = [
    {
      icon: BookMarked,
      label: '등록된 런북',
      value: `${runbookCount}개`,
      sub: '대응 시나리오',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      icon: TrendingDown,
      label: '누적 장애 이력',
      value: `${totalCount}건`,
      sub: '전체 기간',
      color: 'text-slate-300',
      bg: 'bg-slate-700/40',
    },
    {
      icon: AlertOctagon,
      label: 'P1 장애',
      value: `${p1Count}건`,
      sub: `전체의 ${Math.round((p1Count / totalCount) * 100)}%`,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      icon: Clock,
      label: '평균 해결 시간',
      value: `${avgDuration}분`,
      sub: `최다 발생: ${topService?.[0] ?? '-'}`,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map(({ icon: Icon, label, value, sub, color, bg }) => (
        <div
          key={label}
          className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center gap-4"
        >
          <div className={`p-2.5 rounded-xl ${bg} shrink-0`}>
            <Icon size={18} className={color} />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
