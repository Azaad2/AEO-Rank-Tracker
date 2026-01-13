import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, Loader2, Search, TrendingUp, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Keyword {
  keyword: string;
  type: string;
  intent: string;
  difficulty: string;
  aiPotential: string;
  suggestedContent: string;
}

interface TopicCluster {
  pillarTopic: string;
  subtopics: string[];
}

interface KeywordResult {
  seedKeyword: string;
  keywords: Keyword[];
  topicClusters: TopicCluster[];
  contentGaps: string[];
  aiOptimizationNotes: string;
}

const intents = ["All", "Informational", "Transactional", "Navigational", "Commercial"];

const KeywordAnalyzer = () => {
  const [seedKeyword, setSeedKeyword] = useState("");
  const [industry, setIndustry] = useState("");
  const [intent, setIntent] = useState("All");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<KeywordResult | null>(null);

  const handleGenerate = async () => {
    if (!seedKeyword.trim()) {
      toast.error("Please enter a seed keyword");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-keywords", {
        body: { seedKeyword, industry, intent: intent === "All" ? undefined : intent },
      });

      if (error) throw error;
      setResult(data);
      toast.success("Keywords analyzed!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to analyze keywords. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyKeywords = async () => {
    if (!result?.keywords) return;
    const text = result.keywords.map(k => k.keyword).join('\n');
    await navigator.clipboard.writeText(text);
    toast.success("Keywords copied!");
  };

  const downloadCSV = () => {
    if (!result?.keywords) return;
    const headers = "Keyword,Type,Intent,Difficulty,AI Potential,Suggested Content";
    const rows = result.keywords.map(k => 
      `"${k.keyword}","${k.type}","${k.intent}","${k.difficulty}","${k.aiPotential}","${k.suggestedContent}"`
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keyword-analysis.csv";
    a.click();
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === "low") return "bg-green-100 text-green-800";
    if (difficulty === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getPotentialColor = (potential: string) => {
    if (potential === "high") return "bg-green-100 text-green-800";
    if (potential === "medium") return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const relatedTools = [
    { title: "Title Generator", href: "/tools/title-generator", description: "Create SEO titles" },
    { title: "Content Auditor", href: "/tools/content-auditor", description: "Audit content" },
    { title: "AI Blog Outline", href: "/tools/ai-blog-outline", description: "Create blog outlines" },
  ];

  return (
    <ToolLayout
      title="AI Keyword Analyzer"
      description="Discover AI-focused keyword opportunities and build topic clusters that get cited by AI assistants."
      relatedTools={relatedTools}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Analyze Keywords
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="seed">Seed Keyword *</Label>
                <Input
                  id="seed"
                  placeholder="e.g., AI SEO optimization"
                  value={seedKeyword}
                  onChange={(e) => setSeedKeyword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., Marketing, SaaS"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
              <div>
                <Label>Search Intent</Label>
                <Select value={intent} onValueChange={setIntent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {intents.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Keywords...
                </>
              ) : (
                "Analyze Keywords"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={copyKeywords}>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Keywords Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Keyword Opportunities ({result.keywords?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Intent</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>AI Potential</TableHead>
                        <TableHead>Content Suggestion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.keywords?.map((kw, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{kw.keyword}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{kw.type}</Badge>
                          </TableCell>
                          <TableCell className="capitalize">{kw.intent}</TableCell>
                          <TableCell>
                            <Badge className={getDifficultyColor(kw.difficulty)}>{kw.difficulty}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPotentialColor(kw.aiPotential)}>{kw.aiPotential}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {kw.suggestedContent}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Topic Clusters */}
            {result.topicClusters && result.topicClusters.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Topic Clusters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.topicClusters.map((cluster, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">{cluster.pillarTopic}</h4>
                      <div className="flex flex-wrap gap-2">
                        {cluster.subtopics.map((sub, j) => (
                          <Badge key={j} variant="secondary">{sub}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Content Gaps */}
            {result.contentGaps && result.contentGaps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Gaps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.contentGaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary">→</span>
                        <span className="text-muted-foreground">{gap}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* AI Notes */}
            {result.aiOptimizationNotes && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">AI Optimization Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{result.aiOptimizationNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default KeywordAnalyzer;
