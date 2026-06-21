import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, AlertTriangle, TrendingDown } from "lucide-react";

interface ConversionFunnelProps {
  timeRange: "24h" | "7d" | "30d";
}

const COHORTS = ["Direct", "Google", "ChatGPT", "Reddit", "LinkedIn", "Referral"] as const;

export const ConversionFunnel = ({ timeRange }: ConversionFunnelProps) => {
  const getTimeFilter = () => {
    const now = new Date();
    const hours = timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720;
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return cutoff.toISOString();
  };

  const { data: funnelData } = useQuery({
    queryKey: ["conversion-funnel", timeRange],
    queryFn: async () => {
      const cutoff = getTimeFilter();

      const { data, error } = await supabase
        .from("user_activity")
        .select("event_type, session_id, event_metadata")
        .gte("created_at", cutoff);

      if (error) throw error;

      const count = (...types: string[]) =>
        data?.filter((d) => types.includes(d.event_type as string)).length || 0;

      const pageViews = count("page_view");
      const scansStarted = count("scan_started", "scan_initiated");
      const scansCompleted = count("scan_completed");
      const resultsViewed = count("results_viewed");
      const signupClicks = count("signup_cta_clicked", "signup_cta_click");
      const accountsCreated = count("account_created");

      const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

      const steps = [
        { label: "Homepage Visitor", value: pageViews },
        { label: "Scan Started", value: scansStarted },
        { label: "Scan Completed", value: scansCompleted },
        { label: "Results Viewed", value: resultsViewed },
        { label: "Signup CTA Clicked", value: signupClicks },
        { label: "Account Created", value: accountsCreated },
      ].map((s, i, arr) => ({
        ...s,
        percentage: pct(s.value, arr[0].value),
        stepPct: i === 0 ? 100 : pct(s.value, arr[i - 1].value),
      }));

      // Biggest drop-off between consecutive steps
      let drop = { from: "", to: "", retained: 100, lost: 0 };
      for (let i = 1; i < steps.length; i++) {
        const prev = steps[i - 1];
        const curr = steps[i];
        if (prev.value === 0) continue;
        const retained = curr.stepPct;
        const lost = 100 - retained;
        if (lost > drop.lost) drop = { from: prev.label, to: curr.label, retained, lost };
      }

      // Cohort breakdown for account_created
      const cohortCounts: Record<string, number> = Object.fromEntries(
        COHORTS.map((c) => [c, 0]),
      );
      let cohortTotal = 0;
      for (const row of data || []) {
        if (row.event_type !== "account_created") continue;
        const src = ((row.event_metadata as any)?.acquisition_source || "Direct") as string;
        const bucket = (COHORTS as readonly string[]).includes(src) ? src : "Referral";
        cohortCounts[bucket] = (cohortCounts[bucket] || 0) + 1;
        cohortTotal += 1;
      }
      const cohorts = COHORTS.map((name) => ({
        name,
        value: cohortCounts[name] || 0,
        percentage: cohortTotal > 0 ? Math.round(((cohortCounts[name] || 0) / cohortTotal) * 100) : 0,
      }));

      return { steps, drop, cohorts, cohortTotal };
    },
    refetchInterval: 5000,
  });

  const getColorByPercentage = (percentage: number) => {
    if (percentage >= 20) return "bg-success";
    if (percentage >= 10) return "bg-warning";
    return "bg-destructive";
  };

  const stepColor = (pct: number) => {
    if (pct >= 60) return "text-green-500";
    if (pct >= 30) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>Homepage → Scan → Results → Signup → Account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {funnelData?.drop && funnelData.drop.from && (
          <div className="p-4 rounded-lg border border-destructive/40 bg-destructive/5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Biggest Funnel Drop-Off</p>
              <p className="text-sm text-muted-foreground">
                Only <span className="font-bold text-destructive">{funnelData.drop.retained}%</span> of users
                who reached <span className="font-medium">{funnelData.drop.from}</span> continued to{" "}
                <span className="font-medium">{funnelData.drop.to}</span>.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {funnelData?.steps.map((step, index) => (
            <div key={step.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full ${getColorByPercentage(step.percentage)} flex items-center justify-center text-white font-bold text-sm`}
                  >
                    {step.percentage}%
                  </div>
                  <div>
                    <p className="font-semibold">{step.label}</p>
                    <p className="text-sm text-muted-foreground">{step.value} users</p>
                  </div>
                </div>
              </div>

              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${getColorByPercentage(step.percentage)} transition-all duration-500`}
                  style={{ width: `${step.percentage}%` }}
                />
              </div>

              {index < (funnelData?.steps.length || 0) - 1 && (
                <div className="flex items-center justify-center gap-2 py-1 text-xs">
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {step.label} → {funnelData?.steps[index + 1].label} ={" "}
                  </span>
                  <span className={`font-bold ${stepColor(funnelData?.steps[index + 1].stepPct ?? 0)}`}>
                    {funnelData?.steps[index + 1].stepPct}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Cohort breakdown */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Account Creation by Acquisition Source</h4>
            <span className="text-xs text-muted-foreground">{funnelData?.cohortTotal ?? 0} signups</span>
          </div>
          {funnelData?.cohortTotal === 0 ? (
            <p className="text-xs text-muted-foreground">No account_created events yet for this range.</p>
          ) : (
            <div className="space-y-2">
              {funnelData?.cohorts.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">
                      {c.value} <span className="text-xs">({c.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
