import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Users, ListChecks } from "lucide-react";

interface Row {
  id: string;
  user_id: string | null;
  domain: string | null;
  error_type: string | null;
  error_message: string;
  stack_trace: string | null;
  component: string | null;
  url: string | null;
  browser: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
}

function ScanErrorsInner() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("scan_errors" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && data) setRows(data as unknown as Row[]);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const affected = new Set(
      rows.map((r) => r.user_id).filter(Boolean) as string[]
    ).size;
    const byType = rows.reduce<Record<string, number>>((acc, r) => {
      const k = r.error_type || "Unknown";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const byBrowser = rows.reduce<Record<string, number>>((acc, r) => {
      const k = r.browser || "Unknown";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return { total, affected, byType, byBrowser };
  }, [rows]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-32 px-6 max-w-7xl mx-auto pb-20">
        <h1
          className="text-2xl text-yellow-400 mb-6"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          Scan Errors
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" /> Total errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <Users className="h-4 w-4 text-yellow-400" /> Affected users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{stats.affected}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-green-400" /> Distinct error types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">
                    {Object.keys(stats.byType).length}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-base">
                    Error type frequency
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.byType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-300">{k}</span>
                        <Badge variant="outline" className="border-gray-700">
                          {v}
                        </Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-base">
                    Browser breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(stats.byBrowser)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-300">{k}</span>
                        <Badge variant="outline" className="border-gray-700">
                          {v}
                        </Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base">
                  Recent errors (last 500)
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-red-700 text-red-300"
                          >
                            {r.error_type || "Error"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-300">
                          {r.component || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-gray-200 max-w-md truncate">
                          {r.error_message}
                        </TableCell>
                        <TableCell className="text-xs">{r.domain || "—"}</TableCell>
                        <TableCell className="text-xs">{r.browser || "—"}</TableCell>
                        <TableCell className="text-xs font-mono">
                          {r.user_id ? r.user_id.slice(0, 8) : "guest"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-gray-500 py-8"
                        >
                          No errors logged yet — nice!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

export default function ScanErrors() {
  return (
    <AdminGuard>
      <ScanErrorsInner />
    </AdminGuard>
  );
}
