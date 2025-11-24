import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsCards } from "@/components/analytics/MetricsCards";
import { EventsChart } from "@/components/analytics/EventsChart";
import { ActivityFeed } from "@/components/analytics/ActivityFeed";
import { TopEventsTable } from "@/components/analytics/TopEventsTable";
import { ConversionFunnel } from "@/components/analytics/ConversionFunnel";
import { EngagementMetrics } from "@/components/analytics/EngagementMetrics";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Analytics = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Monitor user activity and engagement metrics</p>
            </div>
          </div>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="w-auto">
            <TabsList>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <MetricsCards timeRange={timeRange} />

        <EngagementMetrics timeRange={timeRange} />

        <div className="grid gap-6 md:grid-cols-2">
          <ConversionFunnel timeRange={timeRange} />
          
          <Card>
            <CardHeader>
              <CardTitle>Live Activity Feed</CardTitle>
              <CardDescription>Real-time user events</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ActivityFeed />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Activity Over Time</CardTitle>
              <CardDescription>Events tracked across all sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <EventsChart timeRange={timeRange} />
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <TopEventsTable timeRange={timeRange} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
