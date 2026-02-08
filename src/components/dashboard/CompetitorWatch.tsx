import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Swords, TrendingUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompetitorData {
  name: string;
  count: number;
  percentage: number;
}

export function CompetitorWatch() {
  const { user } = useAuth();
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPrompts, setTotalPrompts] = useState(0);

  useEffect(() => {
    fetchCompetitors();
  }, [user]);

  async function fetchCompetitors() {
    if (!user) return;
    try {
      // Fetch user's scans
      const { data: scans, error: scanError } = await supabase
        .from('scans')
        .select('id')
        .eq('user_id', user.id);

      if (scanError) throw scanError;
      if (!scans || scans.length === 0) {
        setIsLoading(false);
        return;
      }

      const scanIds = scans.map(s => s.id);

      // Fetch scan results for those scans
      const { data: results, error: resultsError } = await supabase
        .from('scan_results')
        .select('gemini_competitors, top_cited_domains')
        .in('scan_id', scanIds);

      if (resultsError) throw resultsError;
      if (!results) {
        setIsLoading(false);
        return;
      }

      setTotalPrompts(results.length);

      // Aggregate competitors
      const competitorMap = new Map<string, number>();
      for (const result of results) {
        const allCompetitors = [
          ...(result.gemini_competitors || []),
          ...(result.top_cited_domains || []),
        ];
        for (const c of allCompetitors) {
          const name = c.trim();
          if (name) {
            competitorMap.set(name, (competitorMap.get(name) || 0) + 1);
          }
        }
      }

      const sorted = Array.from(competitorMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / results.length) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setCompetitors(sorted);
    } catch (error) {
      console.error('Error fetching competitors:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        </CardContent>
      </Card>
    );
  }

  if (competitors.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Swords className="h-5 w-5 text-yellow-400" />
            Competitor Watch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-8">
            Run scans to see which competitors appear most frequently in AI answers for your queries.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Swords className="h-5 w-5 text-yellow-400" />
          Competitor Watch
        </CardTitle>
        <p className="text-xs text-gray-400">
          Based on {totalPrompts} prompts across your scans
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {competitors.map((comp, i) => (
          <div
            key={comp.name}
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50"
          >
            <span className="text-lg font-bold text-gray-500 w-6 text-center">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-white font-medium truncate">{comp.name}</p>
                <Badge variant="outline" className="text-xs bg-gray-700/50 text-gray-300 border-gray-600">
                  {comp.count}x
                </Badge>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                <div
                  className="bg-yellow-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(comp.percentage, 100)}%` }}
                />
              </div>
            </div>
            <Link to={`/tools/competitor-analyzer?competitor=${encodeURIComponent(comp.name)}`}>
              <Button size="sm" variant="ghost" className="text-yellow-400 hover:text-yellow-300 text-xs">
                <Swords className="h-3 w-3 mr-1" />
                Beat
              </Button>
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
