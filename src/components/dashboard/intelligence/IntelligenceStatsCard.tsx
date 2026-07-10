import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Database, Flame, Layers, Users, Zap } from 'lucide-react';

interface Stats {
  total_scans: number;
  scans_7d: number;
  industries_covered: number;
  engines_tracked: number;
  total_citations: number;
  opportunities_tracked: number;
  clusters_discovered: number;
  brands_tracked: number;
  domains_tracked: number;
}

export function IntelligenceStatsCard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    supabase
      .from('market_intelligence_stats' as any)
      .select('*')
      .single()
      .then(({ data }) => data && setStats(data as unknown as Stats));
  }, []);

  const items = [
    { label: 'Scans done', value: stats?.total_scans, icon: Activity, hint: `+${stats?.scans_7d ?? 0} this week` },
    { label: 'Industries', value: stats?.industries_covered, icon: Layers },
    { label: 'AI tools', value: stats?.engines_tracked, icon: Zap },
    { label: 'AI mentions', value: stats?.total_citations, icon: Database },
    { label: 'Opportunities', value: stats?.opportunities_tracked, icon: Flame },
    { label: 'Brands watched', value: stats?.brands_tracked, icon: Users },
  ];

  return (
    <div className="rounded-lg border border-yellow-400/30 bg-gradient-to-r from-yellow-400/10 via-gray-900 to-gray-900 p-4">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <div className="text-[10px] tracking-widest uppercase text-yellow-400/80">Powered by AI Mention You</div>
          <div className="text-sm text-gray-300 mt-1">Real, anonymous data from every scan we run — the more brands we see, the smarter this gets.</div>
        </div>
        <div className="text-[10px] text-gray-500">Every scan helps everyone.</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {items.map(it => (
          <div key={it.label} className="bg-black/40 border border-gray-800 rounded p-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500">
              <it.icon className="h-3 w-3 text-yellow-400" /> {it.label}
            </div>
            <div className="text-lg font-bold text-yellow-400 mt-1">
              {stats ? (it.value ?? 0).toLocaleString() : '—'}
            </div>
            {it.hint && <div className="text-[10px] text-gray-500 mt-0.5">{it.hint}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
