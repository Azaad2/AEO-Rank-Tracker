import { TrendingUp } from 'lucide-react';

/** Horizontal bar comparison: You vs Top competitor vs Industry median. */
export function BarCompare({
  you,
  peer,
  top,
  unit,
  topLabel,
}: {
  you: number;
  peer: number;
  top?: number | null;
  unit: string;
  topLabel?: string;
}) {
  const max = Math.max(you, peer, top ?? 0, 1);
  const rows: Array<{ label: string; value: number; color: string; text: string }> = [
    { label: 'You', value: you, color: 'bg-gray-500', text: 'text-gray-300' },
    {
      label: 'Typical brand in your space',
      value: peer,
      color: 'bg-yellow-400',
      text: 'text-yellow-400',
    },
  ];
  if (top != null && top > 0) {
    rows.push({
      label: topLabel ? `Leader: ${topLabel}` : 'Top brand in your space',
      value: top,
      color: 'bg-red-400',
      text: 'text-red-300',
    });
  }
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={r.text}>{r.label}</span>
            <span className="text-white font-medium">
              {r.value} <span className="text-gray-500 font-normal">{unit}</span>
            </span>
          </div>
          <div className="h-2.5 bg-gray-800 rounded overflow-hidden">
            <div
              className={`h-full ${r.color} transition-all`}
              style={{ width: `${Math.max(4, (r.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Gap thermometer — where you sit between 0 and the leader. */
export function GapMeter({
  you,
  leader,
  unit,
}: {
  you: number;
  leader: number;
  unit: string;
}) {
  const max = Math.max(leader, you, 1);
  const pct = Math.min(100, Math.max(2, (you / max) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">You</span>
        <span className="text-red-300">Leader ({leader} {unit})</span>
      </div>
      <div className="relative h-3 rounded bg-gradient-to-r from-red-500/30 via-yellow-500/30 to-green-500/30 overflow-hidden">
        <div
          className="absolute top-0 h-full w-1 bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
          style={{ left: `calc(${pct}% - 2px)` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white font-medium">You: {you} {unit}</span>
        <span className="text-gray-500">Gap: {Math.max(0, leader - you)} {unit}</span>
      </div>
    </div>
  );
}

/** Dot grid — filled = websites mentioning you; hollow = websites mentioning competitors that don't mention you. */
export function DotGrid({ filled, total }: { filled: number; total: number }) {
  const safeTotal = Math.max(total, filled, 1);
  const capped = Math.min(safeTotal, 40);
  const filledCapped = Math.round((filled / safeTotal) * capped);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: capped }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full ${
              i < filledCapped ? 'bg-yellow-400' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-gray-400">
        <span>
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-400 mr-1 align-middle" />
          Talk about you: <span className="text-white font-medium">{filled}</span>
        </span>
        <span>
          <span className="inline-block h-2 w-2 rounded-full bg-gray-700 mr-1 align-middle" />
          Missing you: <span className="text-white font-medium">{Math.max(0, total - filled)}</span>
        </span>
      </div>
    </div>
  );
}

/** Ring — projected gain, used when no peer data exists. */
export function GainRing({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const R = 34;
  const C = 2 * Math.PI * R;
  const off = C * (1 - clamped / 100);
  return (
    <div className="flex items-center gap-3">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={R} stroke="#1f2937" strokeWidth="8" fill="none" />
        <circle
          cx="42"
          cy="42"
          r={R}
          stroke="#facc15"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={off}
          transform="rotate(-90 42 42)"
        />
        <text
          x="42"
          y="47"
          textAnchor="middle"
          fill="#facc15"
          fontSize="16"
          fontWeight="700"
        >
          +{clamped.toFixed(0)}%
        </text>
      </svg>
      <div>
        <div className="text-xs uppercase tracking-wide text-yellow-400/80 font-semibold mb-1 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> Projected gain
        </div>
        <p className="text-xs text-gray-400 leading-relaxed max-w-[220px]">
          Estimated boost to your AI visibility once this is done.
        </p>
      </div>
    </div>
  );
}

/** Health semicircle gauge — 0 to 100. */
export function HealthGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const R = 46;
  const C = Math.PI * R; // half circumference
  const off = C * (1 - v / 100);
  const color = v >= 80 ? '#4ade80' : v >= 60 ? '#facc15' : '#f87171';
  return (
    <svg width="120" height="72" viewBox="0 0 120 72">
      <path
        d={`M 10 62 A ${R} ${R} 0 0 1 110 62`}
        stroke="#1f2937"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M 10 62 A ${R} ${R} 0 0 1 110 62`}
        stroke={color}
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={off}
      />
      <text
        x="60"
        y="58"
        textAnchor="middle"
        fill={color}
        fontSize="22"
        fontWeight="700"
      >
        {Math.round(v)}
      </text>
    </svg>
  );
}

/** Stacked breakdown bar — urgent / quick wins / bigger projects. */
export function StackedBreakdown({
  urgent,
  quick,
  bigger,
}: {
  urgent: number;
  quick: number;
  bigger: number;
}) {
  const total = Math.max(1, urgent + quick + bigger);
  const seg = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full rounded overflow-hidden bg-gray-800">
        {urgent > 0 && (
          <div className="bg-red-400" style={{ width: seg(urgent) }} title={`Urgent: ${urgent}`} />
        )}
        {quick > 0 && (
          <div
            className="bg-green-400"
            style={{ width: seg(quick) }}
            title={`Quick wins: ${quick}`}
          />
        )}
        {bigger > 0 && (
          <div
            className="bg-blue-400"
            style={{ width: seg(bigger) }}
            title={`Bigger projects: ${bigger}`}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        <span className="text-red-300">
          <span className="inline-block h-2 w-2 rounded-sm bg-red-400 mr-1 align-middle" /> Urgent {urgent}
        </span>
        <span className="text-green-300">
          <span className="inline-block h-2 w-2 rounded-sm bg-green-400 mr-1 align-middle" /> Quick wins {quick}
        </span>
        <span className="text-blue-300">
          <span className="inline-block h-2 w-2 rounded-sm bg-blue-400 mr-1 align-middle" /> Bigger projects {bigger}
        </span>
      </div>
    </div>
  );
}
