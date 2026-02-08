import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface ScoreTrendProps {
  domain: string;
  scans: { score: number | null; created_at: string }[];
}

export function ScoreTrend({ domain, scans }: ScoreTrendProps) {
  const chartData = scans
    .filter(s => s.score !== null)
    .map(s => ({
      date: format(new Date(s.created_at), 'MMM d'),
      score: s.score,
    }));

  if (chartData.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-yellow-400" />
            Score Trend — {domain}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm text-center py-8">
            No scan data yet for this domain. Run a scan to see trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  const latestScore = chartData[chartData.length - 1]?.score || 0;
  const previousScore = chartData.length > 1 ? chartData[chartData.length - 2]?.score || 0 : latestScore;
  const change = latestScore - previousScore;

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-yellow-400" />
            Score Trend — {domain}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{latestScore}</span>
            {change !== 0 && (
              <span className={`text-sm font-medium ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change > 0 ? '+' : ''}{change}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
            <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#9CA3AF' }}
              itemStyle={{ color: '#FACC15' }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#FACC15"
              strokeWidth={2}
              dot={{ fill: '#FACC15', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
