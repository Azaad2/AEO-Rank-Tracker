import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Row {
  id: string;
  scan_id: string | null;
  title: string;
  description: string | null;
  category: string;
  recommendation_type: string | null;
  confidence: number;
  priority_score: number | null;
  status: string;
  evidence: any;
  evidence_urls: string[] | null;
  competitor_examples: any;
  created_at: string;
  completed_at: string | null;
  industry_id: string | null;
  scans?: {
    project_domain: string | null;
    industry_id: string | null;
    topic_cluster_id: string | null;
    classification_confidence: number | null;
    industries?: { name: string | null } | null;
    topic_clusters?: { name: string | null } | null;
  } | null;
}

interface OutcomeRow {
  recommendation_id: string;
  success_flag: boolean;
}

function summarizeEvidence(ev: any): string {
  if (!ev || typeof ev !== 'object') return '—';
  const src = ev.source || ev.peer_source || ev.evidence_source;
  if (src) return String(src);
  const keys = Object.keys(ev).slice(0, 3);
  return keys.length ? keys.join(', ') : '—';
}

function summarizeCompetitor(c: any): string {
  if (!c) return '—';
  if (Array.isArray(c)) {
    return c
      .slice(0, 2)
      .map((x: any) => x?.brand || x?.name || x?.domain || String(x))
      .filter(Boolean)
      .join(', ') || '—';
  }
  if (typeof c === 'object') return c.brand || c.name || c.domain || '—';
  return String(c);
}

function Inner() {
  const [rows, setRows] = useState<Row[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');

  async function load() {
    setLoading(true);
    const [{ data: recs }, { data: outs }] = await Promise.all([
      supabase
        .from('recommendations')
        .select(
          'id, scan_id, title, description, category, recommendation_type, confidence, priority_score, status, evidence, evidence_urls, competitor_examples, created_at, completed_at, industry_id, scans:scan_id(project_domain, industry_id, topic_cluster_id, classification_confidence, industries:industry_id(name), topic_clusters:topic_cluster_id(name))',
        )
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('recommendation_outcomes').select('recommendation_id, success_flag'),
    ]);
    setRows((recs ?? []) as any);
    setOutcomes((outs ?? []) as any);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (cat !== 'all' && r.category !== cat) return false;
      if (q) {
        const hay = `${r.title} ${r.scans?.project_domain ?? ''} ${r.scans?.industries?.name ?? ''} ${r.recommendation_type ?? ''}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, q, cat]);

  // Analytics
  const total = rows.length;
  const completed = rows.filter((r) => r.status === 'completed').length;
  const dismissed = rows.filter((r) => r.status === 'dismissed').length;
  const pending = rows.filter((r) => r.status === 'pending').length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  const byCategory = useMemo(() => {
    const m = new Map<string, { total: number; completed: number; dismissed: number }>();
    for (const r of rows) {
      const k = r.category || 'unknown';
      if (!m.has(k)) m.set(k, { total: 0, completed: 0, dismissed: 0 });
      const e = m.get(k)!;
      e.total += 1;
      if (r.status === 'completed') e.completed += 1;
      if (r.status === 'dismissed') e.dismissed += 1;
    }
    return [...m.entries()]
      .map(([k, v]) => ({
        category: k,
        ...v,
        rate: v.total ? Math.round((v.completed / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [rows]);

  const categories = useMemo(() => {
    const s = new Set<string>(rows.map((r) => r.category));
    return ['all', ...[...s].sort()];
  }, [rows]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-32 px-6 max-w-7xl mx-auto pb-20 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl text-yellow-400" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              Recommendation Audit
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              QA every recommendation across every scan: evidence, competitor reference, and confidence.
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <SyncResendButton />
            <SendNewsletterButton />
          </div>
        </div>

        <NewsletterLogPanel />

        {/* Analytics strip */}
        <div className="grid md:grid-cols-4 gap-4">
          <StatCard label="Generated" value={total} />
          <StatCard label="Completed" value={completed} accent="text-green-400" />
          <StatCard label="Dismissed" value={dismissed} accent="text-red-400" />
          <StatCard label="Completion rate" value={`${completionRate}%`} accent="text-yellow-400" />
        </div>

        {/* By category */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Completion rate by category</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">Category</TableHead>
                  <TableHead className="text-gray-400 text-right">Total</TableHead>
                  <TableHead className="text-gray-400 text-right">Completed</TableHead>
                  <TableHead className="text-gray-400 text-right">Dismissed</TableHead>
                  <TableHead className="text-gray-400 text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCategory.map((c) => (
                  <TableRow key={c.category} className="border-gray-800">
                    <TableCell className="text-white">{c.category}</TableCell>
                    <TableCell className="text-right text-gray-300">{c.total}</TableCell>
                    <TableCell className="text-right text-green-400">{c.completed}</TableCell>
                    <TableCell className="text-right text-red-400">{c.dismissed}</TableCell>
                    <TableCell className="text-right text-yellow-400">{c.rate}%</TableCell>
                  </TableRow>
                ))}
                {byCategory.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-6">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <div className="text-xs text-gray-500 mt-3">
              Logged outcomes: {outcomes.length} ({outcomes.filter(o => o.success_flag).length} success · {outcomes.filter(o => !o.success_flag).length} dismissed)
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search domain, title, type…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="bg-gray-900 border-gray-800 text-white max-w-xs"
          />
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-white rounded-md px-3 py-2 text-sm"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="text-xs text-gray-500">{filtered.length} of {rows.length} shown</div>
        </div>

        {/* Audit table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Domain</TableHead>
                      <TableHead className="text-gray-400">Industry</TableHead>
                      <TableHead className="text-gray-400">Topic cluster</TableHead>
                      <TableHead className="text-gray-400">Recommendation</TableHead>
                      <TableHead className="text-gray-400">Evidence source</TableHead>
                      <TableHead className="text-gray-400">Competitor ref</TableHead>
                      <TableHead className="text-gray-400 text-right">Confidence</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id} className="border-gray-800 align-top">
                        <TableCell className="text-white whitespace-nowrap">
                          {r.scans?.project_domain ?? '—'}
                        </TableCell>
                        <TableCell className="text-gray-300 whitespace-nowrap">
                          {r.scans?.industries?.name ?? <span className="text-gray-600">unclassified</span>}
                          {r.scans?.classification_confidence != null && (
                            <div className="text-xs text-gray-500">
                              {Math.round((r.scans.classification_confidence ?? 0) * 100)}%
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300 whitespace-nowrap">
                          {r.scans?.topic_clusters?.name ?? '—'}
                        </TableCell>
                        <TableCell className="text-white max-w-sm">
                          <div className="font-medium">{r.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            <Badge variant="outline" className="border-gray-700 text-gray-400 mr-1">
                              {r.category}
                            </Badge>
                            {r.recommendation_type && (
                              <span className="text-gray-500">{r.recommendation_type}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300 text-xs max-w-xs">
                          <div>{summarizeEvidence(r.evidence)}</div>
                          {r.evidence_urls?.length ? (
                            <div className="text-gray-500 truncate mt-1">
                              {r.evidence_urls.length} URL{r.evidence_urls.length === 1 ? '' : 's'}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-gray-300 text-xs max-w-xs">
                          {summarizeCompetitor(r.competitor_examples)}
                        </TableCell>
                        <TableCell className="text-right text-yellow-400 whitespace-nowrap">
                          {r.confidence}%
                          {r.priority_score != null && (
                            <div className="text-xs text-gray-500">p={Number(r.priority_score).toFixed(0)}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              r.status === 'completed'
                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                : r.status === 'dismissed'
                                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                : 'bg-gray-700 text-gray-300'
                            }
                          >
                            {r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-12">
                          No recommendations match.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-5">
        <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
        <div className={`text-3xl font-bold mt-1 ${accent ?? 'text-white'}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function SyncResendButton() {
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-resend-audience');
      if (error) throw error;
      toast({
        title: 'Resend audience synced',
        description: `Added ${data.added} · Updated ${data.updated} · Skipped ${data.skipped}${data.errors?.length ? ` · ${data.errors.length} errors` : ''}`,
      });
    } catch (e: any) {
      toast({ title: 'Sync failed', description: e.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button onClick={run} disabled={busy} className="bg-yellow-400 hover:bg-yellow-500 text-black">
      {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
      Sync contacts to Resend
    </Button>
  );
}

function SendNewsletterButton() {
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-daily-newsletter');
      if (error) throw error;
      if (data?.skipped) {
        toast({ title: 'Already sent today', description: `Broadcast ${data.broadcast_id}` });
      } else if (data?.sent) {
        toast({ title: 'Newsletter sent', description: data.subject });
      } else {
        toast({ title: 'Done', description: JSON.stringify(data).slice(0, 160) });
      }
    } catch (e: any) {
      toast({ title: 'Newsletter failed', description: e.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button onClick={run} disabled={busy} variant="outline" className="border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10">
      {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
      Send today's newsletter
    </Button>
  );
}

function NewsletterLogPanel() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from('newsletter_log')
      .select('send_date, subject, status, broadcast_id, error, created_at')
      .order('created_at', { ascending: false })
      .limit(14)
      .then(({ data }) => setRows(data ?? []));
  }, []);
  if (!rows.length) return null;
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white text-base">Recent newsletters</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800">
              <TableHead className="text-gray-400">Date</TableHead>
              <TableHead className="text-gray-400">Subject</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} className="border-gray-800">
                <TableCell className="text-gray-300 text-sm">{r.send_date}</TableCell>
                <TableCell className="text-white text-sm">{r.subject}</TableCell>
                <TableCell className={
                  r.status === 'sent' ? 'text-green-400 text-sm' :
                  r.status === 'failed' ? 'text-red-400 text-sm' : 'text-yellow-400 text-sm'
                }>{r.status}</TableCell>
                <TableCell className="text-red-400 text-xs max-w-xs truncate">{r.error ?? ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AdminRecommendations() {
  return (
    <AdminGuard>
      <Inner />
    </AdminGuard>
  );
}
