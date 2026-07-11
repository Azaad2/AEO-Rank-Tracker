import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Sparkles, Globe, Wand2 } from 'lucide-react';

export interface EvidenceTile {
  label: string;
  competitor: number | string;
  you: number | string;
  hint?: string;
}

export interface WinningPage {
  url: string;
  title: string | null;
  asset_type: string | null;
  count: number;
}

export interface Gap {
  label: string;         // e.g. "CRM Alternatives"
  assetType: string;     // internal type
  toolPath: string;      // /tools/...
  toolLabel: string;     // "Generate"
  topic?: string;        // query-string topic
}

export function EvidenceGrid({ tiles }: { tiles: EvidenceTile[] }) {
  const visible = tiles.filter((t) => Number(t.competitor) > 0 || Number(t.you) > 0);
  if (visible.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-yellow-400 mb-2 flex items-center gap-1.5">
        <Sparkles className="h-3 w-3" /> AI Evidence — what we actually found
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {visible.map((t) => {
          const c = Number(t.competitor);
          const y = Number(t.you);
          const ahead = c > y;
          return (
            <div key={t.label} className="rounded-lg bg-gray-900 border border-gray-700 p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">{t.label}</p>
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Them</span>
                  <span className={`text-sm font-bold ${ahead ? 'text-yellow-400' : 'text-white'}`}>
                    {t.competitor}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">You</span>
                  <span className={`text-sm font-bold ${ahead ? 'text-red-400' : 'text-green-400'}`}>
                    {t.you}
                  </span>
                </div>
              </div>
              {t.hint && <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">{t.hint}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SourceChips({ domains }: { domains: string[] }) {
  if (!domains.length) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-blue-400 mb-2 flex items-center gap-1.5">
        <Globe className="h-3 w-3" /> Where they're cited (real sources)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {domains.map((d) => (
          <span
            key={d}
            className="text-[11px] px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-200 flex items-center gap-1.5"
          >
            <img
              src={`https://www.google.com/s2/favicons?domain=${d}&sz=32`}
              alt=""
              className="w-3 h-3 rounded-sm"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TopicsChips({ topics, pageCount }: { topics: string[]; pageCount: number }) {
  if (!topics.length) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-purple-400 mb-2">
        Topics they own
      </p>
      <p className="text-xs text-gray-300">
        AI found <span className="text-white font-semibold">{pageCount} pages</span> from them about{' '}
        {topics.map((t, i) => (
          <span key={t}>
            <span className="text-purple-300">{t}</span>
            {i < topics.length - 1 ? ' · ' : ''}
          </span>
        ))}
      </p>
    </div>
  );
}

export function WinningPagesList({ pages }: { pages: WinningPage[] }) {
  if (!pages.length) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-green-400 mb-2">
        Their top winning pages
      </p>
      <ul className="space-y-1.5">
        {pages.map((p) => (
          <li key={p.url} className="flex items-start gap-2 text-xs">
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-200 hover:text-yellow-400 flex items-start gap-1.5 flex-1 min-w-0"
            >
              <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-60" />
              <span className="truncate">{p.title || p.url}</span>
            </a>
            {p.asset_type && (
              <Badge
                variant="outline"
                className="text-[9px] border-gray-600 text-gray-400 flex-shrink-0"
              >
                {prettyAsset(p.asset_type)}
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GapList({ gaps }: { gaps: Gap[] }) {
  if (!gaps.length) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-red-400 mb-2 flex items-center gap-1.5">
        <Wand2 className="h-3 w-3" /> Pages you're missing — generate them
      </p>
      <div className="space-y-2">
        {gaps.map((g) => (
          <div
            key={g.label}
            className="flex items-center justify-between gap-2 rounded bg-gray-800 border border-gray-700 p-2.5"
          >
            <span className="text-sm text-gray-200">
              You don't have a <span className="text-white font-semibold">{g.label}</span> page
            </span>
            <Link
              to={
                g.topic
                  ? `${g.toolPath}?topic=${encodeURIComponent(g.topic)}`
                  : g.toolPath
              }
            >
              <Button size="sm" className="h-7 bg-yellow-400 text-black hover:bg-yellow-300 text-xs">
                {g.toolLabel}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function prettyAsset(a: string): string {
  const map: Record<string, string> = {
    comparison_page: 'Comparison',
    listicle: 'Listicle',
    directory_listing: 'Directory',
    reddit_thread: 'Reddit',
    forum_thread: 'Forum',
    review_page: 'Review',
    blog_article: 'Guide',
    landing_page: 'Landing',
    news_article: 'News',
    documentation_page: 'Docs',
    other: 'Page',
  };
  return map[a] ?? a;
}
