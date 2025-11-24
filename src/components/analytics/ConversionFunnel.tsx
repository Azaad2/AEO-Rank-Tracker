import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

interface ConversionFunnelProps {
  timeRange: "24h" | "7d" | "30d";
}

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
        .select("event_type, session_id")
        .gte("created_at", cutoff);

      if (error) throw error;

      const pageViews = data?.filter(d => d.event_type === "page_view").length || 0;
      const formInteractions = new Set(
        data?.filter(d => d.event_type === "form_interaction").map(d => d.session_id)
      ).size;
      const scansInitiated = data?.filter(d => d.event_type === "scan_initiated").length || 0;
      const scansCompleted = data?.filter(d => d.event_type === "scan_completed").length || 0;

      return {
        steps: [
          { label: "Page Views", value: pageViews, percentage: 100 },
          { 
            label: "Form Interactions", 
            value: formInteractions, 
            percentage: pageViews > 0 ? Math.round((formInteractions / pageViews) * 100) : 0 
          },
          { 
            label: "Scans Initiated", 
            value: scansInitiated, 
            percentage: pageViews > 0 ? Math.round((scansInitiated / pageViews) * 100) : 0 
          },
          { 
            label: "Scans Completed", 
            value: scansCompleted, 
            percentage: pageViews > 0 ? Math.round((scansCompleted / pageViews) * 100) : 0 
          },
        ],
      };
    },
    refetchInterval: 5000,
  });

  const getColorByPercentage = (percentage: number) => {
    if (percentage >= 20) return "bg-success";
    if (percentage >= 10) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>Track visitor journey from page view to scan completion</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {funnelData?.steps.map((step, index) => (
            <div key={step.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${getColorByPercentage(step.percentage)} flex items-center justify-center text-white font-bold text-sm`}>
                    {step.percentage}%
                  </div>
                  <div>
                    <p className="font-semibold">{step.label}</p>
                    <p className="text-sm text-muted-foreground">{step.value} visitors</p>
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
                <div className="flex justify-center py-1">
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {funnelData && funnelData.steps[0].value > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">Key Insights</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                • {funnelData.steps[1].percentage}% of visitors interact with the form
              </li>
              <li>
                • {funnelData.steps[2].percentage}% conversion rate to scan initiation
              </li>
              {funnelData.steps[2].value > 0 && funnelData.steps[3].value > 0 && (
                <li>
                  • {Math.round((funnelData.steps[3].value / funnelData.steps[2].value) * 100)}% scan completion rate
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
