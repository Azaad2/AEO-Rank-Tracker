import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
    <Card>
      <CardHeader>
        <CardTitle>Top Events</CardTitle>
        <CardDescription>Most frequent user actions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Type</TableHead>
              <TableHead className="text-right">Total Count</TableHead>
              <TableHead className="text-right">Unique Sessions</TableHead>
              <TableHead className="text-right">Avg per Session</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topEvents && topEvents.length > 0 ? (
              topEvents.map((event) => (
                <TableRow key={event.event_type}>
                  <TableCell>
                    <Badge variant="outline">{getEventLabel(event.event_type)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{event.count}</TableCell>
                  <TableCell className="text-right">{event.unique_sessions}</TableCell>
                  <TableCell className="text-right">
                    {(event.count / event.unique_sessions).toFixed(1)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No events recorded yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
