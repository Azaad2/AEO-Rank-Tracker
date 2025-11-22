import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface EventsChartProps {
  timeRange: "24h" | "7d" | "30d";
}

export const EventsChart = ({ timeRange }: EventsChartProps) => {
  const getTimeFilter = () => {
    const now = new Date();
    const hours = timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720;
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return cutoff.toISOString();
  };

  const { data: chartData } = useQuery({
    queryKey: ["analytics-chart", timeRange],
    queryFn: async () => {
      const cutoff = getTimeFilter();
      
      const { data, error } = await supabase
        .from("user_activity")
        .select("event_type, created_at")
        .gte("created_at", cutoff)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by hour or day depending on range
      const grouped = new Map<string, { scans: number; interactions: number; total: number }>();
      
      data?.forEach((event) => {
        const date = new Date(event.created_at);
        let key: string;
        
        if (timeRange === "24h") {
          key = `${date.getHours()}:00`;
        } else {
          key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }

        const current = grouped.get(key) || { scans: 0, interactions: 0, total: 0 };
        current.total++;
        
        if (event.event_type === "scan_completed") {
          current.scans++;
        } else if (["cta_click", "faq_opened", "csv_download"].includes(event.event_type)) {
          current.interactions++;
        }
        
        grouped.set(key, current);
      });

      return Array.from(grouped.entries()).map(([time, data]) => ({
        time,
        ...data,
      }));
    },
    refetchInterval: 10000,
  });

  const chartConfig = {
    scans: {
      label: "Scans",
      color: "hsl(var(--success))",
    },
    interactions: {
      label: "Interactions",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="scans"
            stackId="1"
            stroke="hsl(var(--success))"
            fill="hsl(var(--success))"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="interactions"
            stackId="1"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
