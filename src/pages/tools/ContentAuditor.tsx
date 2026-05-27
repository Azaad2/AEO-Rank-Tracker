import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Globe, AlertTriangle, Wrench, Copy, Check, ListPlus } from "lucide-react";

interface Issue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  evidence: string;
  fixType: string;
}

interface AuditResponse {
  url: string;
  overallScore: number;
  pageMeta: { title: string; description: string; h1: string; wordCount: number; canonical?: string; imgCount?: number; internalLinkCount?: number };
  issues: Issue[];
}

const severityColor: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/40",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/40",
};

const ContentAuditor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [url, setUrl] = useState(searchParams.get("url") || "");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);

  const [fixOpen, setFixOpen] = useState(false);
  const [fixingIssue, setFixingIssue] = useState<Issue | null>(null);
  const [fixContent, setFixContent] = useState("");
  const [fixLoading, setFixLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const runScan = async (targetUrl: string) => {
    setIsScanning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("audit-content", { body: { url: targetUrl } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as AuditResponse);
      setResultsOpen(true);
    } catch (e: any) {
      toast.error(e.message || "Scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  const handleScan = async () => {
    if (!url.trim()) {
      toast.error("Please enter a website URL");
      return;
    }
    await runScan(url.trim());
  };

  const openFix = async (issue: Issue, res: AuditResponse) => {
    if (!user) {
      toast.info("Sign up free to apply this fix");
      const redirect = `/tools/content-auditor?url=${encodeURIComponent(res.url)}&fix=${encodeURIComponent(issue.id)}`;
      navigate(`/auth?mode=signup&redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    setFixingIssue(issue);
    setFixContent("");
    setFixOpen(true);
    setFixLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("audit-fix", {
        body: { url: res.url, fixType: issue.fixType, issueId: issue.id, pageMeta: res.pageMeta },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setFixContent((data as any).fix || "");
    } catch (e: any) {
      toast.error(e.message || "Could not generate fix");
      setFixOpen(false);
    } finally {
      setFixLoading(false);
    }
  };

  const copyFix = async () => {
    await navigator.clipboard.writeText(fixContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const saveToActionPlan = async () => {
    if (!user || !fixingIssue) return;
    try {
      const { error } = await supabase.from("optimization_tasks").insert({
        user_id: user.id,
        title: `Fix: ${fixingIssue.title}`,
        description: `${fixingIssue.evidence}\n\nGenerated fix:\n${fixContent}`,
        priority: fixingIssue.severity === "critical" || fixingIssue.severity === "high" ? "high" : "medium",
        status: "pending",
      });
      if (error) throw error;
      toast.success("Saved to your Action Plan");
    } catch (e: any) {
      toast.error(e.message || "Could not save");
    }
  };

  // Auto-scan + auto-open fix after signup bounce-back
  useEffect(() => {
    const qUrl = searchParams.get("url");
    const qFix = searchParams.get("fix");
    if (qUrl && user && !result && !isScanning) {
      (async () => {
        await runScan(qUrl);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const qFix = searchParams.get("fix");
    if (qFix && result && user) {
      const issue = result.issues.find(i => i.id === qFix);
      if (issue) openFix(issue, result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  return (
    <ToolLayout
      title="AI Content Auditor"
      description="Scan any URL and instantly see what's hurting your AI visibility — with one-click fixes."
    >
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-yellow-400" />
            Scan a Website
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://yourdomain.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="bg-black border-gray-700 text-white"
            />
            <Button onClick={handleScan} disabled={isScanning} className="bg-yellow-400 text-black hover:bg-yellow-300">
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan Website"}
            </Button>
          </div>
          <p className="text-sm text-gray-400">
            We'll fetch your page, detect AI/SEO issues, and show one-click fixes for each.
          </p>
        </CardContent>
      </Card>

      {/* Results modal */}
      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">Audit Results</DialogTitle>
            <DialogDescription className="text-gray-400 break-all">{result?.url}</DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-5">
              <Card className="bg-black border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm text-gray-400">AI Readiness Score</span>
                    <span className="text-3xl font-bold text-yellow-400">{result.overallScore}/100</span>
                  </div>
                  <Progress value={result.overallScore} className="h-2" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                    <div><div className="text-gray-500 text-xs">Title</div><div className="truncate">{result.pageMeta.title || "—"}</div></div>
                    <div><div className="text-gray-500 text-xs">H1</div><div className="truncate">{result.pageMeta.h1 || "—"}</div></div>
                    <div><div className="text-gray-500 text-xs">Words</div><div>{result.pageMeta.wordCount}</div></div>
                    <div><div className="text-gray-500 text-xs">Issues found</div><div>{result.issues.length}</div></div>
                  </div>
                </CardContent>
              </Card>

              {result.issues.length === 0 ? (
                <p className="text-green-400 text-center py-6">No major issues detected. Nicely done!</p>
              ) : (
                <div className="space-y-3">
                  {result.issues.map((issue) => (
                    <Card key={issue.id} className="bg-black border-gray-800">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                            <h4 className="font-semibold">{issue.title}</h4>
                          </div>
                          <Badge variant="outline" className={severityColor[issue.severity]}>{issue.severity}</Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{issue.evidence}</p>
                        <Button size="sm" onClick={() => openFix(issue, result)} className="bg-yellow-400 text-black hover:bg-yellow-300">
                          <Wrench className="w-4 h-4 mr-1" /> Fix this
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fix modal */}
      <Dialog open={fixOpen} onOpenChange={setFixOpen}>
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">{fixingIssue?.title}</DialogTitle>
            <DialogDescription className="text-gray-400">{fixingIssue?.evidence}</DialogDescription>
          </DialogHeader>
          {fixLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-yellow-400" /></div>
          ) : (
            <pre className="bg-black border border-gray-800 rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap max-h-[50vh] overflow-y-auto">{fixContent}</pre>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={copyFix} disabled={!fixContent} className="border-gray-700">
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button onClick={saveToActionPlan} disabled={!fixContent} className="bg-yellow-400 text-black hover:bg-yellow-300">
              <ListPlus className="w-4 h-4 mr-1" /> Save to Action Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToolLayout>
  );
};

export default ContentAuditor;
