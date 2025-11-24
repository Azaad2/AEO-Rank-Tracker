import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TopEventsTableProps {
  timeRange: "24h" | "7d" | "30d";
}

export const TopEventsTable = ({ timeRange }: TopEventsTableProps) => {
  const getTimeFilter = () => {
    const now = new Date();
    const hours = timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720;
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return cutoff.toISOString();
  };

  const { data: topEvents } = useQuery({
    queryKey: ["analytics-top-events", timeRange],
    queryFn: async () => {
      const cutoff = getTimeFilter();
      
      const { data, error } = await supabase
        .from("user_activity")
        .select("event_type, session_id")
        .gte("created_at", cutoff);

      if (error) throw error;

      // Count events by type
      const eventCounts = new Map<string, { count: number; sessions: Set<string> }>();
      
      data?.forEach((event) => {
        const current = eventCounts.get(event.event_type) || { 
          count: 0, 
          sessions: new Set() 
        };
        current.count++;
        current.sessions.add(event.session_id);
        eventCounts.set(event.event_type, current);
      });

      return Array.from(eventCounts.entries())
        .map(([event_type, data]) => ({
          event_type,
          count: data.count,
          unique_sessions: data.sessions.size,
        }))
        .sort((a, b) => b.count - a.count);
    },
    refetchInterval: 10000,
  });

  const getEventLabel = (eventType: string) => {
    return eventType
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Top Events</CardTitle>
        <CardDescription>Most frequent user actions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Type</TableHead>
              <TableHead className="text-right">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topEvents && topEvents.length > 0 ? (
              topEvents.slice(0, 6).map((event) => (
                <TableRow key={event.event_type}>
                  <TableCell className="font-medium text-sm">
                    {getEventLabel(event.event_type)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{event.count}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground text-sm">
                  No events recorded yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </>
  );
};
