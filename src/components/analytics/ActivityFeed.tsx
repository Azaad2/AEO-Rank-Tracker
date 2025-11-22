import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Scan, 
  Download, 
  MousePointerClick, 
  HelpCircle,
  AlertCircle 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityEvent {
  id: string;
  event_type: string;
  event_metadata: any;
  session_id: string;
  created_at: string;
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    // Fetch initial activities
    const fetchActivities = async () => {
      const { data } = await supabase
        .from("user_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setActivities(data);
    };

    fetchActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_activity",
        },
        (payload) => {
          setActivities((prev) => [payload.new as ActivityEvent, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "scan_initiated":
      case "scan_completed":
        return Scan;
      case "scan_failed":
        return AlertCircle;
      case "csv_download":
        return Download;
      case "cta_click":
        return MousePointerClick;
      case "faq_opened":
        return HelpCircle;
      default:
        return Activity;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "scan_completed":
        return "bg-success/10 text-success";
      case "scan_failed":
        return "bg-destructive/10 text-destructive";
      case "csv_download":
        return "bg-primary/10 text-primary";
      case "cta_click":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getEventLabel = (eventType: string) => {
    return eventType
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <ScrollArea className="h-[400px] px-6 pb-6">
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground">Events will appear here in real-time</p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = getEventIcon(activity.event_type);
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className={`p-2 rounded-md ${getEventColor(activity.event_type)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {getEventLabel(activity.event_type)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {activity.event_metadata && Object.keys(activity.event_metadata).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(activity.event_metadata).slice(0, 2).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {String(value).substring(0, 20)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground font-mono">
                    Session: {activity.session_id.substring(0, 8)}...
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
};
