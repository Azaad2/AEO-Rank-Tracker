import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download } from "lucide-react";

interface ScanResult {
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  citationRank: number | null;
  topCitedDomains: string[];
  debug: { usedResults: string[] };
}

interface ScanResponse {
  project: string;
  promptsCount: number;
  score: number;
  results: ScanResult[];
}

const Index = () => {
  const [domain, setDomain] = useState("");
  const [promptsText, setPromptsText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const { toast } = useToast();

  const handleScan = async () => {
    if (!domain.trim() || !promptsText.trim()) {
      toast({
        title: "Missing input",
        description: "Please provide both domain and prompts",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanData(null);

    try {
      const { data, error } = await supabase.functions.invoke('scan', {
        body: {
          domain: domain.trim(),
          promptsText: promptsText.trim(),
          market: 'en-US',
        },
      });

      if (error) throw error;

      setScanData(data);
      toast({
        title: "Scan complete",
        description: `AI Visibility Score: ${data.score}`,
      });
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Scan failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const downloadCSV = () => {
    if (!scanData) return;

    const headers = ['Prompt', 'Mentioned', 'Cited', 'Citation Rank', 'Top Cited Domains'];
    const rows = scanData.results.map(r => [
      r.prompt,
      r.mentioned ? 'Yes' : 'No',
      r.cited ? 'Yes' : 'No',
      r.citationRank?.toString() || '—',
      r.topCitedDomains.join(', '),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-visibility-${scanData.project}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-score-high";
    if (score >= 40) return "text-score-medium";
    return "text-score-low";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Visibility Checker
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We simulate AI answers from public web results and report mentions & citations for your brand.
          </p>
        </div>

        {/* Input Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Enter Scan Details</CardTitle>
            <CardDescription>
              Provide your domain and the prompts/keywords you want to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="domain" className="text-sm font-medium">
                Domain
              </label>
              <Input
                id="domain"
                placeholder="bndbox.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={isScanning}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="prompts" className="text-sm font-medium">
                Prompts/Keywords (one per line)
              </label>
              <Textarea
                id="prompts"
                placeholder="best wholesale marketplace for resellers&#10;bndbox vs faire&#10;is bndbox legit?"
                value={promptsText}
                onChange={(e) => setPromptsText(e.target.value)}
                disabled={isScanning}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Maximum 15 prompts. Separate by line break or comma.
              </p>
            </div>

            <Button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full"
              size="lg"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                "Scan"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {scanData && (
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Scan Results</CardTitle>
                  <CardDescription>
                    Project: {scanData.project} • {scanData.promptsCount} prompts analyzed
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">AI Visibility Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(scanData.score)}`}>
                      {scanData.score}
                    </p>
                  </div>
                  <Button
                    onClick={downloadCSV}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prompt</TableHead>
                      <TableHead className="text-center">Mentioned</TableHead>
                      <TableHead className="text-center">Cited</TableHead>
                      <TableHead className="text-center">Citation Rank</TableHead>
                      <TableHead>Top Cited Domains</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanData.results.map((result, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium max-w-xs">
                          {result.prompt}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.mentioned ? (
                            <span className="text-success">✓</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.cited ? (
                            <span className="text-success">✓</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.citationRank ? (
                            <span className="font-semibold text-primary">
                              {result.citationRank}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {result.topCitedDomains.slice(0, 3).join(', ') || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          This tool estimates 'AI-answer' visibility using public web results.
        </p>
      </div>
    </div>
  );
};

export default Index;
