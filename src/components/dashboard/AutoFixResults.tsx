import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Sparkles, Copy, Check, ChevronDown, ChevronRight,
  FileText, Code, BookOpen, Tag, AlertCircle
} from 'lucide-react';

interface ContentSuggestion {
  prompt: string;
  title: string;
  content: string;
}

interface BlogOutline {
  title: string;
  sections: { heading: string; points: string[] }[];
}

interface MetaRewrite {
  page: string;
  title: string;
  description: string;
}

interface OptimizationData {
  id: string;
  scan_id: string;
  content_suggestions: ContentSuggestion[];
  faq_schema: string;
  blog_outlines: BlogOutline[];
  meta_rewrites: MetaRewrite[];
  status: string;
  created_at: string;
}

export function AutoFixResults() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<OptimizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    content: true, faq: false, blog: false, meta: false,
  });

  useEffect(() => {
    fetchLatest();
  }, [user]);

  async function fetchLatest() {
    if (!user) return;
    try {
      const { data: rows, error } = await supabase
        .from('auto_optimizations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (rows && rows.length > 0) {
        const row = rows[0] as any;
        setData({
          id: row.id,
          scan_id: row.scan_id,
          content_suggestions: (row.content_suggestions as ContentSuggestion[]) || [],
          faq_schema: (row.faq_schema as string) || '',
          blog_outlines: (row.blog_outlines as BlogOutline[]) || [],
          meta_rewrites: (row.meta_rewrites as MetaRewrite[]) || [],
          status: row.status,
          created_at: row.created_at,
        });
      }
    } catch (err) {
      console.error('Error fetching auto-fix results:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopiedId(null), 2000);
  }

  function toggleSection(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Auto-Fix Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No optimization results yet.</p>
            <p className="text-gray-500 text-sm mt-1">Run a scan to automatically generate your optimization package.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const timeAgo = getTimeAgo(data.created_at);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-400" />
          <h2 className="text-lg font-semibold text-white">Auto-Fix Results</h2>
          <Badge className="bg-green-900/50 text-green-400 border-green-700 text-xs">
            Ready
          </Badge>
        </div>
        <span className="text-xs text-gray-500">Generated {timeAgo}</span>
      </div>

      {/* Content Suggestions */}
      <Collapsible open={openSections.content} onOpenChange={() => toggleSection('content')}>
        <Card className="bg-gray-900 border-gray-700">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-gray-800/50 transition-colors">
              <CardTitle className="text-white flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  Content to Add
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                    {data.content_suggestions.length} items
                  </Badge>
                </span>
                {openSections.content ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {data.content_suggestions.map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs text-yellow-400 mb-1">For query: "{item.prompt}"</p>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white h-7"
                      onClick={() => copyToClipboard(item.content, `content-${idx}`)}
                    >
                      {copiedId === `content-${idx}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* FAQ Schema */}
      <Collapsible open={openSections.faq} onOpenChange={() => toggleSection('faq')}>
        <Card className="bg-gray-900 border-gray-700">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-gray-800/50 transition-colors">
              <CardTitle className="text-white flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-green-400" />
                  FAQ Schema Markup
                </span>
                {openSections.faq ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-gray-400 hover:text-white h-7 z-10"
                  onClick={() => copyToClipboard(data.faq_schema, 'faq')}
                >
                  {copiedId === 'faq' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copiedId === 'faq' ? 'Copied' : 'Copy'}
                </Button>
                <pre className="p-4 rounded-lg bg-gray-800 border border-gray-700 text-xs text-green-300 overflow-x-auto max-h-80">
                  <code>{data.faq_schema}</code>
                </pre>
              </div>
              <p className="text-xs text-gray-500 mt-2">Paste this JSON-LD into your website's &lt;head&gt; tag.</p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Blog Outlines */}
      <Collapsible open={openSections.blog} onOpenChange={() => toggleSection('blog')}>
        <Card className="bg-gray-900 border-gray-700">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-gray-800/50 transition-colors">
              <CardTitle className="text-white flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-400" />
                  Blog Outlines
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                    {data.blog_outlines.length} outlines
                  </Badge>
                </span>
                {openSections.blog ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {data.blog_outlines.map((outline, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-medium text-white">{outline.title}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white h-7"
                      onClick={() => copyToClipboard(
                        `# ${outline.title}\n\n${outline.sections.map(s => `## ${s.heading}\n${s.points.map(p => `- ${p}`).join('\n')}`).join('\n\n')}`,
                        `blog-${idx}`
                      )}
                    >
                      {copiedId === `blog-${idx}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  {outline.sections.map((section, sIdx) => (
                    <div key={sIdx} className="mb-2 last:mb-0">
                      <p className="text-xs font-medium text-yellow-400 mb-1">{section.heading}</p>
                      <ul className="space-y-0.5">
                        {section.points.map((point, pIdx) => (
                          <li key={pIdx} className="text-xs text-gray-400 flex items-start gap-1.5">
                            <span className="text-gray-600 mt-0.5">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Meta Rewrites */}
      <Collapsible open={openSections.meta} onOpenChange={() => toggleSection('meta')}>
        <Card className="bg-gray-900 border-gray-700">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-gray-800/50 transition-colors">
              <CardTitle className="text-white flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-orange-400" />
                  Meta Rewrites
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                    {data.meta_rewrites.length} pages
                  </Badge>
                </span>
                {openSections.meta ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3 pt-0">
              {data.meta_rewrites.map((meta, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">{meta.page}</p>
                      <p className="text-sm text-blue-400 font-medium">{meta.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{meta.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white h-7"
                      onClick={() => copyToClipboard(`Title: ${meta.title}\nDescription: ${meta.description}`, `meta-${idx}`)}
                    >
                      {copiedId === `meta-${idx}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
