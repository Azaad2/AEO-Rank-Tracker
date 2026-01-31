import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Zap, FileSearch } from 'lucide-react';

interface CreditUsageProps {
  promptsUsed: number;
  promptsLimit: number;
  scansUsed: number;
  scansLimit: number;
}

export function CreditUsage({ promptsUsed, promptsLimit, scansUsed, scansLimit }: CreditUsageProps) {
  const promptsPercentage = promptsLimit > 0 ? (promptsUsed / promptsLimit) * 100 : 0;
  const scansPercentage = scansLimit > 0 ? (scansUsed / scansLimit) * 100 : 0;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            Prompts Used
          </CardTitle>
          <Zap className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {promptsUsed} / {promptsLimit}
          </div>
          <Progress 
            value={promptsPercentage} 
            className="mt-2 h-2 bg-gray-700"
          />
          <p className="text-xs text-gray-500 mt-2">
            {promptsLimit - promptsUsed} prompts remaining this period
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            Scans Used
          </CardTitle>
          <FileSearch className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {scansUsed} / {scansLimit}
          </div>
          <Progress 
            value={scansPercentage} 
            className="mt-2 h-2 bg-gray-700"
          />
          <p className="text-xs text-gray-500 mt-2">
            {scansLimit - scansUsed} scans remaining this period
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
