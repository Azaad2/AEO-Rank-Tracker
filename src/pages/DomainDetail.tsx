import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ScoreTrend } from "@/components/dashboard/ScoreTrend";
import {
  deriveIssues, getUniqueCompetitors, severityStyles, type ScanResultLite, type Issue,
} from "@/utils/deriveIssues";
import {
  ArrowLeft, Globe, Loader2, RefreshCw, Wrench, Copy, CheckCircle2, XCircle, TrendingUp,
  Sparkles, AlertTriangle, ListChecks, Swords, Trophy, ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Scan {
  id: string;
  score: number | null;
  created_at: string;
  is_auto_scan: boolean;
  prompts: string[];
}

interface ScanResultRow {
  scan_id: string;
  prompt: string;
  mentioned: boolean | null;
  cited: boolean | null;
  gemini_mentioned: boolean | null;
  gemini_cited: boolean | null;
  gemini_competitors: string[] | null;
  top_cited_domains: string[] | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
}

const scoreColor = (s: number) =>
  s >= 70 ? "text-green-400" : s >= 40 ? "text-yellow-400" : "text-red-400";

function DomainDetailContent() {
  const { domain = "" } = useParams<{ domain: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [scans, setScans] = useState<Scan[]>([]);
  const [latestResults, setLatestResults] = useState<ScanResultRow[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescanning, setRescanning] = useState(false);

  // Schema health (audit-content)
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [schemaIssues, setSchemaIssues] = useState<any[]>([]);
  const [pageMeta, setPageMeta] = useState<any>(null);

  // Fix dialog
  const [fixOpen, setFixOpen] = useState(false);
  const [fixLoading, setFixLoading] = useState(false);
  const [fixContent, setFixContent] = useState("");
  const [activeIssue, setActiveIssue] = useState<{ title: string; fixType: string; severity: string } | null>(null);

  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  const url = `https://${cleanDomain}`;

  useEffect(() => {
    if (!user) return;
    void loadAll();
    void loadSchema();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cleanDomain]);

  async function loadAll() {
    setLoading(true);
    const { data: scanRows } = await supabase
      .from("scans")
      .select("id, score, created_at, is_auto_scan, prompts")
      .eq("user_id", user!.id)
      .eq("project_domain", cleanDomain)
      .order("created_at", { ascending: false })
      .limit(90);
    const list = (scanRows || []) as Scan[];
    setScans(list);

    if (list.length > 0) {
      const latest = list[0];
      const { data: results } = await supabase
        .from("scan_results")
        .select("scan_id, prompt, mentioned, cited, gemini_mentioned, gemini_cited, gemini_competitors, top_cited_domains")
        .eq("scan_id", latest.id);
      setLatestResults((results || []) as ScanResultRow[]);

      const scanIds = list.map(s => s.id);
      const { data: taskRows } = await supabase
        .from("optimization_tasks")
        .select("id, title, description, status, priority, created_at")
        .eq("user_id", user!.id)
        .in("scan_id", scanIds)
        .order("created_at", { ascending: false });
      setTasks((taskRows || []) as Task[]);
    } else {
      setLatestResults([]);
      setTasks([]);
    }
    setLoading(false);
  }

  async function loadSchema() {
    setSchemaLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("audit-content", { body: { url } });
      if (error) throw error;
      setSchemaIssues(data?.issues || []);
      setPageMeta(data?.pageMeta || null);
    } catch (e) {
      console.error("audit-content failed", e);
    } finally {
      setSchemaLoading(false);
    }
  }

  async function handleRescan() {
    setRescanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("scan", {
        body: { project: cleanDomain, prompts: scans[0]?.prompts?.slice(0, 5) || [`best ${cleanDomain.split(".")[0]} alternatives`] },
      });
      if (error) throw error;
      toast({ title: "Scan complete" });
      await loadAll();
    } catch (e: any) {
      toast({ title: "Scan failed", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setRescanning(false);
    }
  }

  async function openFix(issue: { title: string; fixType: string; severity: string }) {
    setActiveIssue(issue);
    setFixOpen(true);
    setFixLoading(true);
    setFixContent("");
    try {
      const { data, error } = await supabase.functions.invoke("audit-fix", {
        body: {
          url,
          fixType: issue.fixType,
          pageMeta: pageMeta || { title: cleanDomain, description: "", h1: "" },
        },
      });
      if (error) throw error;
      setFixContent(data?.fix || "No fix generated.");
    } catch (e) {
      console.error(e);
      setFixContent("Failed to generate fix. Please try again.");
    } finally {
      setFixLoading(false);
    }
  }

  async function saveTaskToActionPlan() {
    if (!activeIssue || !user) return;
    const priority = activeIssue.severity === "high" || activeIssue.severity === "critical" ? "high"
      : activeIssue.severity === "low" ? "low" : "medium";
    const { error } = await supabase.from("optimization_tasks").insert({
      user_id: user.id,
      title: activeIssue.title,
      description: fixContent.slice(0, 2000),
      priority,
      scan_id: scans[0]?.id || null,
    });
    if (error) toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Saved to Action Plan" });
      await loadAll();
    }
  }

  async function toggleTask(id: string, current: string) {
    const next = current === "completed" ? "pending" : "completed";
    const { error } = await supabase
      .from("optimization_tasks")
      .update({ status: next, completed_at: next === "completed" ? new Date().toISOString() : null })
      .eq("id", id);
    if (!error) setTasks(t => t.map(x => x.id === id ? { ...x, status: next } : x));
  }

  // Derived
  const latestScore = scans[0]?.score ?? 0;
  const weekAgo = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    const older = scans.find(s => new Date(s.created_at).getTime() <= cutoff);
    return older?.score ?? null;
  }, [scans]);
  const delta = weekAgo !== null ? latestScore - weekAgo : 0;

  const liteResults: ScanResultLite[] = latestResults.map(r => ({
    prompt: r.prompt,
    mentioned: !!r.mentioned,
    cited: !!r.cited,
    geminiMentioned: !!r.gemini_mentioned,
    geminiCited: !!r.gemini_cited,
    geminiCompetitors: r.gemini_competitors || [],
    topCitedDomains: r.top_cited_domains || [],
  }));
  const competitors = getUniqueCompetitors(liteResults);
  const issues = deriveIssues(liteResults, latestScore, competitors);

  // Engine breakdown
  const total = liteResults.length || 1;
  const gemRate = Math.round((liteResults.filter(r => r.geminiMentioned).length / total) * 100);
  const gemCite = Math.round((liteResults.filter(r => r.geminiCited).length / total) * 100);
  const srchRate = Math.round((liteResults.filter(r => r.mentioned).length / total) * 100);
  const srchCite = Math.round((liteResults.filter(r => r.cited).length / total) * 100);

  // Missed prompts (competitors ranked, you didn't)
  const missed = liteResults.filter(r => !r.geminiMentioned && !r.mentioned && (r.geminiCompetitors?.length || r.topCitedDomains?.length)).slice(0, 5);

  // Competitor frequency
  const compCounts = new Map<string, number>();
  liteResults.forEach(r => [...(r.geminiCompetitors || []), ...(r.topCitedDomains || [])].forEach(c => {
    compCounts.set(c, (compCounts.get(c) || 0) + 1);
  }));
  const topComps = [...compCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-yellow-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <Link to="/dashboard" className="flex items-center gap-1 hover:text-yellow-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <span>/</span>
        <span className="text-white">{cleanDomain}</span>
      </div>

      {/* Header strip */}
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6 flex flex-wrap items-center gap-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
              <Globe className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{cleanDomain}</h1>
              <p className="text-xs text-gray-400">
                {scans.length > 0
                  ? `Last scan ${formatDistanceToNow(new Date(scans[0].created_at), { addSuffix: true })} · ${scans.length} scans`
                  : "No scans yet — run one to get started"}
                {" · "}
                <a href={url} target="_blank" rel="noreferrer" className="hover:text-yellow-400 inline-flex items-center gap-1">
                  visit <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-400">Visibility</p>
              <p className={`text-3xl font-bold ${scoreColor(latestScore)}`}>{latestScore}<span className="text-base text-gray-500">/100</span></p>
              {weekAgo !== null && delta !== 0 && (
                <p className={`text-xs ${delta > 0 ? "text-green-400" : "text-red-400"}`}>
                  {delta > 0 ? "+" : ""}{delta} vs last week
                </p>
              )}
            </div>
            <Button onClick={handleRescan} disabled={rescanning} className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
              {rescanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Rescan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trend */}
      <ScoreTrend domain={cleanDomain} scans={[...scans].reverse().map(s => ({ score: s.score, created_at: s.created_at, is_auto_scan: s.is_auto_scan }))} />

      {/* Engine breakdown */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-400" /> Per-Engine Breakdown (latest scan)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {[
            { label: "Gemini AI", dot: "bg-blue-500", rate: gemRate, cite: gemCite },
            { label: "ChatGPT / Search", dot: "bg-emerald-500", rate: srchRate, cite: srchCite },
          ].map(e => (
            <div key={e.label} className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${e.dot}`} />
                  <span className="text-sm text-white font-medium">{e.label}</span>
                </div>
                <span className={`font-bold ${scoreColor(e.rate)}`}>{e.rate}%</span>
              </div>
              <Progress value={e.rate} className="h-2" />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Mentions: {e.rate}%</span>
                <span>Citations: {e.cite}%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Issues to Fix */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Wrench className="h-4 w-4 text-yellow-400" /> Issues to Fix
            <Badge variant="outline" className="border-gray-700 text-gray-300">{issues.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {issues.length === 0 && <p className="text-sm text-gray-400">No issues detected. Great job!</p>}
          {issues.map(issue => {
            const done = tasks.some(t => t.title === issue.title && t.status === "completed");
            return (
              <div key={issue.id} className="p-3 bg-gray-800 border border-gray-700 rounded-lg flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded border ${severityStyles[issue.severity]}`}>{issue.severity.toUpperCase()}</span>
                    <span className="text-xs text-gray-500">{issue.category}</span>
                    <span className={`text-sm font-medium ${done ? "text-gray-500 line-through" : "text-white"}`}>{issue.title}</span>
                  </div>
                  <p className="text-xs text-gray-400">{issue.evidence}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => openFix({ title: issue.title, fixType: issue.fixType, severity: issue.severity })}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold shrink-0"
                >
                  <Wrench className="h-3 w-3 mr-1" /> Fix it
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Schema health (from audit-content) */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-yellow-400" /> Schema & On-Page Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {schemaLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4"><Loader2 className="h-4 w-4 animate-spin" /> Scanning {cleanDomain}...</div>
          ) : schemaIssues.length === 0 ? (
            <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle2 className="h-4 w-4" /> Page passes all schema checks.</div>
          ) : (
            schemaIssues.map((iss: any) => (
              <div key={iss.id} className="p-3 bg-gray-800 border border-gray-700 rounded-lg flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1">
                  <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-white">{iss.title} <span className="text-xs text-gray-500 ml-1">· {iss.category}</span></p>
                    <p className="text-xs text-gray-400">{iss.evidence}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline"
                  onClick={() => openFix({ title: iss.title, fixType: iss.fixType, severity: iss.severity })}
                  className="border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10 shrink-0">
                  <Wrench className="h-3 w-3 mr-1" /> Generate
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Ranking opportunities */}
      {missed.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-400" /> Ranking Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {missed.map((m, i) => (
              <div key={i} className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-white font-medium">"{m.prompt}"</p>
                </div>
                <div className="flex flex-wrap gap-1.5 ml-6">
                  <span className="text-xs text-gray-500">Competitors here:</span>
                  {[...new Set([...(m.geminiCompetitors || []), ...(m.topCitedDomains || [])])].slice(0, 4).map(c => (
                    <Badge key={c} className="bg-gray-700 text-gray-300 text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Plan slice */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-yellow-400" /> Action Plan for {cleanDomain}
            <Badge variant="outline" className="border-gray-700 text-gray-300">{tasks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-400">No tasks yet. Generate a fix above and save it to your action plan.</p>
          ) : (
            tasks.slice(0, 10).map(t => (
              <div key={t.id} className="p-3 bg-gray-800 border border-gray-700 rounded-lg flex items-center gap-3">
                <button onClick={() => toggleTask(t.id, t.status)} className="shrink-0">
                  {t.status === "completed"
                    ? <CheckCircle2 className="h-5 w-5 text-green-400" />
                    : <div className="h-5 w-5 rounded-full border-2 border-gray-600" />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${t.status === "completed" ? "text-gray-500 line-through" : "text-white"}`}>{t.title}</p>
                  <p className="text-xs text-gray-500">{t.priority} priority · {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Competitor snapshot */}
      {topComps.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Swords className="h-4 w-4 text-yellow-400" /> Top Competitors (latest scan)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topComps.map(([c, n], i) => (
              <div key={c} className="flex items-center justify-between p-2 bg-gray-800 border border-gray-700 rounded">
                <div className="flex items-center gap-2">
                  <Trophy className={`h-4 w-4 ${i === 0 ? "text-yellow-400" : "text-gray-500"}`} />
                  <span className="text-sm text-white">{c}</span>
                </div>
                <Badge className="bg-gray-700 text-gray-300">{n} appearance{n > 1 ? "s" : ""}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fix dialog */}
      <Dialog open={fixOpen} onOpenChange={setFixOpen}>
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Wrench className="h-5 w-5 text-yellow-400" />
              {activeIssue?.title}
            </DialogTitle>
          </DialogHeader>
          {fixLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Generating fix...
            </div>
          ) : (
            <>
              <pre className="bg-black border border-gray-800 rounded p-3 text-xs text-gray-200 whitespace-pre-wrap max-h-[50vh] overflow-auto">
                {fixContent}
              </pre>
              {fixContent && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() => { navigator.clipboard.writeText(fixContent); toast({ title: "Copied" }); }}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <Button size="sm" onClick={saveTaskToActionPlan}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                    Save to Action Plan
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DomainDetail() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-black">
        <Header />
        <div className="pt-32 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <DomainDetailContent />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
