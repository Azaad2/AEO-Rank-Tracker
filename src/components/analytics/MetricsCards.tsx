import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, MousePointerClick, Scan, Users } from "lucide-react";

interface MetricsCardsProps {
  timeRange: "24h" | "7d" | "30d";
}

export const MetricsCards = ({ timeRange }: MetricsCardsProps) => {
  const getTimeFilter = () => {
    const now = new Date();
    const hours = timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720;
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return cutoff.toISOString();
  };

  const { data: metrics } = useQuery({
    queryKey: ["analytics-metrics", timeRange],
    queryFn: async () => {
      const cutoff = getTimeFilter();
      
      const { data, error } = await supabase
        .from("user_activity")
        .select("event_type, session_id, created_at")
        .gte("created_at", cutoff);

      if (error) throw error;

      const totalEvents = data?.length || 0;
      const uniqueSessions = new Set(data?.map(d => d.session_id)).size;
      const scans = data?.filter(d => d.event_type === "scan_completed").length || 0;
      const interactions = data?.filter(d => 
        ["cta_click", "faq_opened", "csv_download"].includes(d.event_type)
      ).length || 0;

      return { totalEvents, uniqueSessions, scans, interactions };
    },
    refetchInterval: 5000,
  });

  const cards = [
    {
      title: "Total Events",
      value: metrics?.totalEvents || 0,
      icon: Activity,
      color: "text-primary",
    },
    {
      title: "Active Sessions",
      value: metrics?.uniqueSessions || 0,
      icon: Users,
      color: "text-accent",
    },
    {
      title: "Scans Completed",
      value: metrics?.scans || 0,
      icon: Scan,
      color: "text-success",
    },
    {
      title: "User Interactions",
      value: metrics?.interactions || 0,
      icon: MousePointerClick,
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
