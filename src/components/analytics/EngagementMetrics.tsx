import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MousePointerClick, FileDown, HelpCircle } from "lucide-react";

interface EngagementMetricsProps {
  timeRange: "24h" | "7d" | "30d";
}

export const EngagementMetrics = ({ timeRange }: EngagementMetricsProps) => {
  const getTimeFilter = () => {
    const now = new Date();
    const hours = timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720;
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return cutoff.toISOString();
  };

  const { data: metrics } = useQuery({
    queryKey: ["engagement-metrics", timeRange],
    queryFn: async () => {
      const cutoff = getTimeFilter();
      
      const { data, error } = await supabase
        .from("user_activity")
        .select("event_type, session_id")
        .gte("created_at", cutoff);

      if (error) throw error;

      const pageViews = data?.filter(d => d.event_type === "page_view").length || 0;
      const ctaClicks = data?.filter(d => d.event_type === "cta_click").length || 0;
      const csvDownloads = data?.filter(d => d.event_type === "csv_download").length || 0;
      const faqOpens = data?.filter(d => d.event_type === "faq_opened").length || 0;
      const scrollDepth = data?.filter(d => d.event_type === "scroll_depth").length || 0;

      return { pageViews, ctaClicks, csvDownloads, faqOpens, scrollDepth };
    },
    refetchInterval: 5000,
  });

  const cards = [
    {
      title: "Page Views",
      value: metrics?.pageViews || 0,
      icon: Eye,
      color: "text-primary",
    },
    {
      title: "CTA Clicks",
      value: metrics?.ctaClicks || 0,
      icon: MousePointerClick,
      color: "text-accent",
    },
    {
      title: "CSV Downloads",
      value: metrics?.csvDownloads || 0,
      icon: FileDown,
      color: "text-success",
    },
    {
      title: "FAQ Opens",
      value: metrics?.faqOpens || 0,
      icon: HelpCircle,
      color: "text-warning",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
