import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, Loader2, Mail, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GeneratedEmail {
  subject: string;
  body: string;
  style: string;
}

interface EmailResult {
  emails: GeneratedEmail[];
  tips: string[];
}

const tones = ["Professional", "Friendly", "Formal", "Casual", "Persuasive", "Apologetic"];
const recipientTypes = ["Business Contact", "Customer", "Colleague", "Manager", "Vendor", "General"];

const AIEmailGenerator = () => {
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState("Professional");
  const [recipientType, setRecipientType] = useState("Business Contact");
  const [keyPoints, setKeyPoints] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!purpose.trim()) {
      toast.error("Please describe the email purpose");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-email", {
        body: { purpose, tone, recipientType, keyPoints },
      });

      if (error) throw error;
      setResult(data);
      toast.success("Emails generated successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate emails. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (email: GeneratedEmail, index: number) => {
    const content = `Subject: ${email.subject}\n\n${email.body}`;
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadEmails = () => {
    if (!result) return;
    const content = result.emails.map((email, i) => 
      `--- Email ${i + 1} (${email.style}) ---\nSubject: ${email.subject}\n\n${email.body}`
    ).join('\n\n');
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-emails.txt";
    a.click();
  };

  const relatedTools = [
    { title: "AI Answer Generator", href: "/tools/ai-answer-generator", description: "Create citation-optimized answers" },
    { title: "Title Generator", href: "/tools/title-generator", description: "Generate SEO-optimized titles" },
    { title: "Description Generator", href: "/tools/description-generator", description: "Create meta descriptions" },
  ];

  return (
    <ToolLayout
      title="AI Email Generator"
      description="Generate professional, effective emails for any purpose with AI-powered copywriting."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Generate Professional Emails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="purpose">Email Purpose *</Label>
              <Textarea
                id="purpose"
                placeholder="e.g., Follow up on a sales call, request a meeting, apologize for delayed delivery..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recipient Type</Label>
                <Select value={recipientType} onValueChange={setRecipientType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recipientTypes.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="keyPoints">Key Points to Include (Optional)</Label>
              <Input
                id="keyPoints"
                placeholder="e.g., mention the 20% discount, include deadline..."
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
              />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Emails...
                </>
              ) : (
                "Generate 3 Email Variations"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && result.emails && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={downloadEmails}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>

            <Tabs defaultValue="0" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {result.emails.map((email, index) => (
                  <TabsTrigger key={index} value={index.toString()}>
                    {email.style || `Version ${index + 1}`}
                  </TabsTrigger>
                ))}
              </TabsList>
              {result.emails.map((email, index) => (
                <TabsContent key={index} value={index.toString()}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Subject Line:</p>
                          <CardTitle className="text-lg">{email.subject}</CardTitle>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(email, index)}
                        >
                          {copiedIndex === index ? (
                            <><Check className="h-4 w-4 mr-1" /> Copied</>
                          ) : (
                            <><Copy className="h-4 w-4 mr-1" /> Copy</>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                          {email.body}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {result.tips && result.tips.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pro Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                        <span className="text-muted-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default AIEmailGenerator;
