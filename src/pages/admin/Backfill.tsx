import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { isAdminUser } from '@/lib/admin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Play, RefreshCw } from 'lucide-react';

type StatusCounts = Record<string, number>;

interface FailedRow {
  scan_id: string;
  error: string | null;
  attempts: number;
  last_attempt_at: string | null;
}

export default function Backfill() {
  const { user, loading } = useAuth();
  const [counts, setCounts] = useState<StatusCounts>({});
  const [total, setTotal] = useState(0);
  const [failures, setFailures] = useState<FailedRow[]>([]);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const refresh = async () => {
    const { data } = await supabase.from('backfill_jobs').select('status, scan_id, error, attempts, last_attempt_at');
    if (!data) return;
    const c: StatusCounts = {};
    for (const r of data) c[r.status] = (c[r.status] ?? 0) + 1;
    setCounts(c);
    setTotal(data.length);
    setFailures(
      data.filter((r: any) => r.status === 'failed')
        .sort((a: any, b: any) => (b.last_attempt_at ?? '').localeCompare(a.last_attempt_at ?? ''))
        .slice(0, 20) as any,
    );
  };

  useEffect(() => { if (user) refresh(); }, [user]);

  const runBatch = async () => {
    setRunning(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('backfill-scans', {
        body: { batch_size: 25, max_runtime_seconds: 55 },
      });
      if (error) throw error;
      setLastResult(data);
      toast.success(`Processed ${data?.processed ?? 0} • ${data?.succeeded ?? 0} ok • ${data?.failed ?? 0} failed • ${data?.remaining ?? 0} remaining`);
      await refresh();
    } catch (e: any) {
      toast.error(`Backfill failed: ${e?.message ?? e}`);
    } finally {
      setRunning(false);
    }
  };

  const requeueFailed = async () => {
    if (!failures.length) return;
    try {
      const { error } = await supabase.functions.invoke('backfill-scans', {
        body: { reset: true, scan_ids: failures.map(f => f.scan_id) },
      });
      if (error) throw error;
      toast.success(`Requeued ${failures.length} scans`);
      await refresh();
    } catch (e: any) {
      toast.error(`Requeue failed: ${e?.message ?? e}`);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-yellow-400" /></div>;
  }
  if (!isAdminUser(user)) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-black text-white pt-32 px-6">
          <h1 className="text-2xl text-yellow-400">Forbidden</h1>
          <p className="text-gray-400">Admin access required.</p>
        </div>
      </AuthGuard>
    );
  }

  const done = counts['completed'] ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="pt-32 px-6 pb-16 max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                Backfill Console
              </h1>
              <p className="text-gray-400 text-sm mt-2">Replay historical scans through citations → metrics → recommendations → rollup.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={refresh} variant="outline" size="sm" className="border-gray-700">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button onClick={runBatch} disabled={running} className="bg-yellow-400 text-black hover:bg-yellow-300">
                {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Run batch (25)
              </Button>
            </div>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="text-yellow-400">Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{done} / {total} <span className="text-base text-gray-400">({pct}%)</span></div>
              <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
                <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {Object.entries(counts).map(([s, n]) => (
                  <Badge key={s} variant="outline" className="border-gray-700">
                    {s}: {n}
                  </Badge>
                ))}
              </div>
              {lastResult && (
                <pre className="mt-4 text-xs text-gray-400 bg-black p-3 rounded border border-gray-800 overflow-x-auto">
                  {JSON.stringify(lastResult, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-yellow-400">Recent failures</CardTitle>
              {failures.length > 0 && (
                <Button onClick={requeueFailed} size="sm" variant="outline" className="border-gray-700">
                  Requeue all
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {failures.length === 0 ? (
                <p className="text-gray-500 text-sm">No failures.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Scan</TableHead><TableHead>Attempts</TableHead><TableHead>Error</TableHead><TableHead>Last attempt</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {failures.map(f => (
                      <TableRow key={f.scan_id}>
                        <TableCell className="font-mono text-xs">{f.scan_id.slice(0, 8)}…</TableCell>
                        <TableCell>{f.attempts}</TableCell>
                        <TableCell className="text-xs text-red-300 max-w-md truncate">{f.error}</TableCell>
                        <TableCell className="text-xs text-gray-400">{f.last_attempt_at ? new Date(f.last_attempt_at).toLocaleString() : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  );
}
