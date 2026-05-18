import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { isAdminUser } from '@/lib/admin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Download, StopCircle, Play, Upload, FileText, ShieldCheck } from 'lucide-react';

const MAX_BATCH = 100;
const DELAY_MS = 2000;

interface ParsedRow {
  domain: string;
  prompts: string[];
}

interface ScanRowResult {
  brand: string;
  category: string;
  combinedScore: number | null;
  chatgptScore: number | null;
  perplexityScore: number | null;
  geminiScore: number | null;
  claudeScore: number | null;
  topCompetitor: string;
  totalMentions: number;
  totalCitations: number;
  scanDate: string;
  scanId: string | null;
  status: 'success' | 'failed' | 'running' | 'pending';
  error?: string;
}

const DOMAIN_REGEX = /^([a-z0-9-]+\.)+[a-z]{2,}$/i;

function normalizeDomain(raw: string): string {
  return raw.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

function isValidDomain(d: string): boolean {
  return DOMAIN_REGEX.test(d);
}

function parsePastedList(text: string): ParsedRow[] {
  const out: ParsedRow[] = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const [domainPart, promptsPart] = line.split('|').map(s => (s ?? '').trim());
    if (!domainPart || !promptsPart) continue;
    const domain = normalizeDomain(domainPart);
    if (!isValidDomain(domain)) continue;
    const prompts = promptsPart.split(',').map(p => p.trim()).filter(Boolean);
    if (!prompts.length) continue;
    out.push({ domain, prompts });
  }
  return out;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return [];
  const sep = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());
  const domainIdx = headers.findIndex(h => h === 'domain');
  if (domainIdx === -1) return [];
  const promptCols = headers
    .map((h, i) => ({ h, i }))
    .filter(x => /^prompt\d*$/.test(x.h));
  const out: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
    const domain = normalizeDomain(cells[domainIdx] ?? '');
    if (!domain || !isValidDomain(domain)) continue;
    const prompts = promptCols
      .map(({ i: ci }) => cells[ci])
      .filter(Boolean) as string[];
    if (!prompts.length) continue;
    out.push({ domain, prompts });
  }
  return out;
}

function csvEscape(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCSV(filename: string, rows: ScanRowResult[]) {
  const headers = [
    'Brand', 'Category', 'Combined_Score', 'ChatGPT_Score',
    'Perplexity_Score', 'Gemini_Score', 'Claude_Score',
    'Top_Competitor_Mentioned', 'Total_Mentions', 'Total_Citations',
    'Scan_Date', 'Scan_ID',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    const scanLink = r.scanId ? `/scan/${r.scanId}` : '';
    lines.push([
      r.brand, r.category, r.combinedScore, r.chatgptScore,
      r.perplexityScore, r.geminiScore, r.claudeScore,
      r.topCompetitor, r.totalMentions, r.totalCitations,
      r.scanDate, scanLink,
    ].map(csvEscape).join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function BulkScanContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'paste' | 'csv'>('paste');
  const [pasted, setPasted] = useState('');
  const [csvRows, setCsvRows] = useState<ParsedRow[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [category, setCategory] = useState('SaaS');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ScanRowResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedAvgMs, setElapsedAvgMs] = useState(0);
  const stopRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (!isAdminUser(user)) {
      toast.error('Admin access required');
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const parsedFromPaste = useMemo(() => parsePastedList(pasted), [pasted]);
  const activeRows = mode === 'paste' ? parsedFromPaste : csvRows;
  const cappedRows = activeRows.slice(0, MAX_BATCH);
  const canRun = !running && cappedRows.length > 0;

  const handleCsvUpload = async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text);
    setCsvRows(rows);
    setCsvFileName(file.name);
    if (!rows.length) toast.error('No valid rows found in CSV. Expect header: domain,prompt1,prompt2,prompt3');
  };

  const handleStop = () => {
    stopRef.current = true;
    toast.message('Stopping after current scan...');
  };

  const handleRun = async () => {
    if (!user) return;
    if (cappedRows.length === 0) return;
    stopRef.current = false;
    setRunning(true);
    setCurrentIndex(0);

    const initial: ScanRowResult[] = cappedRows.map(r => ({
      brand: r.domain,
      category,
      combinedScore: null,
      chatgptScore: null,
      perplexityScore: null,
      geminiScore: null,
      claudeScore: null,
      topCompetitor: '',
      totalMentions: 0,
      totalCitations: 0,
      scanDate: '',
      scanId: null,
      status: 'pending',
    }));
    setResults(initial);

    const durations: number[] = [];

    for (let i = 0; i < cappedRows.length; i++) {
      if (stopRef.current) break;
      const row = cappedRows[i];
      setCurrentIndex(i);
      setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'running' } : r));

      const started = Date.now();
      try {
        const { data, error } = await supabase.functions.invoke('scan', {
          body: {
            domain: row.domain,
            promptsText: row.prompts.join(', '),
            market: 'en-US',
            userId: user.id,
            adminBulk: true,
          },
        });
        if (error) throw error;

        const rs: any[] = data?.results ?? [];
        const totalMentions = rs.filter(r => r.mentioned || r.geminiMentioned || r.perplexityMentioned).length;
        const totalCitations = rs.filter(r => r.cited || r.geminiCited || r.perplexityCited).length;
        const geminiHits = rs.filter(r => r.geminiMentioned).length;
        const perpHits = rs.filter(r => r.perplexityMentioned).length;
        const searchHits = rs.filter(r => r.mentioned).length;
        const n = Math.max(rs.length, 1);
        const geminiScore = Math.round((geminiHits / n) * 100);
        const perplexityScore = Math.round((perpHits / n) * 100);
        const chatgptScore = Math.round((searchHits / n) * 100);
        const claudeScore = null;

        const compCounts = new Map<string, number>();
        for (const r of rs) {
          for (const c of (r.geminiCompetitors ?? []) as string[]) {
            compCounts.set(c, (compCounts.get(c) ?? 0) + 1);
          }
          for (const c of (r.perplexityCompetitors ?? []) as string[]) {
            compCounts.set(c, (compCounts.get(c) ?? 0) + 1);
          }
        }
        const topCompetitor = [...compCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

        setResults(prev => prev.map((r, idx) => idx === i ? {
          ...r,
          combinedScore: data?.score ?? null,
          chatgptScore,
          perplexityScore,
          geminiScore,
          claudeScore,
          topCompetitor,
          totalMentions,
          totalCitations,
          scanDate: new Date().toISOString(),
          scanId: data?.scanId ?? null,
          status: 'success',
        } : r));
      } catch (err) {
        console.error('Bulk scan failed for', row.domain, err);
        setResults(prev => prev.map((r, idx) => idx === i ? {
          ...r,
          status: 'failed',
          scanDate: new Date().toISOString(),
          error: err instanceof Error ? err.message : 'Unknown error',
        } : r));
      }
      durations.push(Date.now() - started);
      setElapsedAvgMs(durations.reduce((a, b) => a + b, 0) / durations.length);

      if (i < cappedRows.length - 1 && !stopRef.current) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }

    setRunning(false);
    const successCount = results.filter(r => r.status === 'success').length;
    toast.success(`Bulk scan complete`);
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const completed = successCount + failedCount;
  const remaining = Math.max(cappedRows.length - completed, 0);
  const etaMs = remaining * (elapsedAvgMs + DELAY_MS);
  const etaText = etaMs > 0 ? `~ ${Math.max(1, Math.round(etaMs / 60000))} min left` : '';
  const overallPct = cappedRows.length ? Math.round((completed / cappedRows.length) * 100) : 0;
  const current = running ? cappedRows[currentIndex] : null;
  const allDone = !running && results.length > 0 && completed === results.length;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="container mx-auto px-4 pt-32 pb-16 max-w-6xl">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-6 w-6 text-yellow-400" />
          <Badge variant="outline" className="border-yellow-400 text-yellow-400">Admin</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-2">Bulk Scan Tool</h1>
        <p className="text-gray-400 mb-8">Run AI visibility scans on multiple domains in sequence</p>

        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Input</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'paste' | 'csv')}>
              <TabsList className="bg-gray-800">
                <TabsTrigger value="paste"><FileText className="h-4 w-4 mr-2" />Paste List</TabsTrigger>
                <TabsTrigger value="csv"><Upload className="h-4 w-4 mr-2" />Upload CSV</TabsTrigger>
              </TabsList>

              <TabsContent value="paste" className="mt-4">
                <Label className="text-gray-300 mb-2 block">
                  One brand per line: <code className="text-yellow-400">domain | prompt1, prompt2, prompt3</code>
                </Label>
                <Textarea
                  rows={10}
                  value={pasted}
                  onChange={e => setPasted(e.target.value)}
                  placeholder={'notion.com | best note-taking apps, top knowledge management tools, Notion alternatives\nlinear.app | best issue tracker, linear vs jira, software project tools'}
                  className="bg-gray-950 border-gray-700 font-mono text-sm"
                  disabled={running}
                />
              </TabsContent>

              <TabsContent value="csv" className="mt-4">
                <Label className="text-gray-300 mb-2 block">
                  CSV with headers: <code className="text-yellow-400">domain,prompt1,prompt2,prompt3</code>
                </Label>
                <Input
                  type="file"
                  accept=".csv,text/csv"
                  disabled={running}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleCsvUpload(f);
                  }}
                  className="bg-gray-950 border-gray-700"
                />
                {csvFileName && (
                  <p className="text-sm text-gray-400 mt-2">Loaded: {csvFileName}</p>
                )}
              </TabsContent>
            </Tabs>

            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <div>
                <Label className="text-gray-300 mb-2 block">Business type</Label>
                <Select value={category} onValueChange={setCategory} disabled={running}>
                  <SelectTrigger className="bg-gray-950 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="Ecommerce">Ecommerce</SelectItem>
                    <SelectItem value="Agency">Agency</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-400">
                  Detected <span className="text-yellow-400 font-semibold">{cappedRows.length}</span> brands
                  {activeRows.length > MAX_BATCH && (
                    <span className="text-orange-400"> (capped at {MAX_BATCH} of {activeRows.length})</span>
                  )}
                </div>
              </div>
            </div>

            {cappedRows.length > 0 && (
              <div className="mt-4 p-3 rounded bg-gray-950 border border-gray-800">
                <p className="text-sm text-gray-400 mb-2">Preview (first 5):</p>
                <ul className="text-xs font-mono space-y-1 text-gray-300">
                  {cappedRows.slice(0, 5).map((r, i) => (
                    <li key={i}>
                      <span className="text-yellow-400">{r.domain}</span> — {r.prompts.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleRun}
                disabled={!canRun}
                className="bg-[#F5C842] hover:bg-yellow-500 text-black font-semibold"
              >
                {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Run Bulk Scan
              </Button>
              {running && (
                <Button onClick={handleStop} variant="destructive">
                  <StopCircle className="h-4 w-4 mr-2" />Stop Scanning
                </Button>
              )}
              {allDone && (
                <Button
                  onClick={() => downloadCSV(`bulk-scan-${Date.now()}.csv`, results)}
                  variant="outline"
                  className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/10"
                >
                  <Download className="h-4 w-4 mr-2" />Download CSV
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Progress</span>
                {allDone && (
                  <span className="text-sm font-normal text-gray-300">
                    ✅ {successCount}/{results.length} scanned successfully
                    {failedCount > 0 && `, ${failedCount} failed`}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Scanning {Math.min(completed + (running ? 1 : 0), results.length)} of {results.length} brands</span>
                  <span>{etaText}</span>
                </div>
                <Progress value={overallPct} className="h-2" />
                {current && (
                  <p className="text-sm text-gray-300 mt-2">
                    Currently scanning: <span className="text-yellow-400">{current.domain}</span>
                    {' '}({currentIndex + 1}/{results.length})
                  </p>
                )}
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Brand</TableHead>
                      <TableHead className="text-gray-400">Combined</TableHead>
                      <TableHead className="text-gray-400">ChatGPT</TableHead>
                      <TableHead className="text-gray-400">Perplexity</TableHead>
                      <TableHead className="text-gray-400">Gemini</TableHead>
                      <TableHead className="text-gray-400">Claude</TableHead>
                      <TableHead className="text-gray-400">Top Competitor</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => (
                      <TableRow key={i} className="border-gray-800">
                        <TableCell className="font-medium text-white">{r.brand}</TableCell>
                        <TableCell className="text-yellow-400 font-semibold">{r.combinedScore ?? '—'}</TableCell>
                        <TableCell>{r.chatgptScore ?? '—'}</TableCell>
                        <TableCell>{r.perplexityScore ?? '—'}</TableCell>
                        <TableCell>{r.geminiScore ?? '—'}</TableCell>
                        <TableCell>{r.claudeScore ?? '—'}</TableCell>
                        <TableCell className="text-gray-300">{r.topCompetitor || '—'}</TableCell>
                        <TableCell>
                          {r.status === 'success' && <Badge className="bg-green-600">Done</Badge>}
                          {r.status === 'failed' && <Badge variant="destructive">Failed</Badge>}
                          {r.status === 'running' && <Badge className="bg-yellow-500 text-black">Running</Badge>}
                          {r.status === 'pending' && <Badge variant="outline" className="text-gray-400">Pending</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function BulkScan() {
  return (
    <AuthGuard>
      <BulkScanContent />
    </AuthGuard>
  );
}
