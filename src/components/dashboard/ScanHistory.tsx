import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Loader2, ExternalLink } from 'lucide-react';

interface Scan {
  id: string;
  project_domain: string;
  score: number | null;
  created_at: string;
  prompts: string[];
}

export function ScanHistory() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchScans() {
      try {
        const { data, error } = await supabase
          .from('scans')
          .select('id, project_domain, score, created_at, prompts')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setScans(data || []);
      } catch (error) {
        console.error('Error fetching scans:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchScans();
  }, []);

  const getScoreBadgeVariant = (score: number | null) => {
    if (score === null) return 'secondary';
    if (score >= 70) return 'default';
    if (score >= 40) return 'secondary';
    return 'destructive';
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        </CardContent>
      </Card>
    );
  }

  if (scans.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Scan History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-4">
            No scans yet. Run your first scan to see results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Recent Scans</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-400">Domain</TableHead>
              <TableHead className="text-gray-400">Score</TableHead>
              <TableHead className="text-gray-400">Prompts</TableHead>
              <TableHead className="text-gray-400">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scans.map((scan) => (
              <TableRow key={scan.id} className="border-gray-700">
                <TableCell className="text-white font-medium">
                  <div className="flex items-center gap-2">
                    {scan.project_domain}
                    <ExternalLink className="h-3 w-3 text-gray-500" />
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`font-bold ${getScoreColor(scan.score)}`}>
                    {scan.score ?? 'N/A'}
                  </span>
                </TableCell>
                <TableCell className="text-gray-400">
                  {scan.prompts.length} prompts
                </TableCell>
                <TableCell className="text-gray-400">
                  {format(new Date(scan.created_at), 'MMM d, yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
