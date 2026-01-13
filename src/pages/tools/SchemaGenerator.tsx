import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, Loader2, Code, Check, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SchemaResult {
  schema: Record<string, unknown>;
  implementation: string;
  benefits: string[];
  additionalSchemas: string[];
}

const schemaTypes = [
  "Organization",
  "LocalBusiness", 
  "Product",
  "Article",
  "FAQPage",
  "HowTo",
  "Event",
  "Person",
  "Recipe",
  "Service",
  "SoftwareApplication",
  "Course"
];

const SchemaGenerator = () => {
  const [schemaType, setSchemaType] = useState("Organization");
  const [businessDetails, setBusinessDetails] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<SchemaResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!businessDetails.trim()) {
      toast.error("Please enter business details");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-schema", {
        body: { schemaType, businessDetails },
      });

      if (error) throw error;
      setResult(data);
      toast.success("Schema generated!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate schema. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copySchema = async () => {
    if (!result?.schema) return;
    const schemaString = JSON.stringify(result.schema, null, 2);
    const scriptTag = `<script type="application/ld+json">\n${schemaString}\n</script>`;
    await navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    toast.success("Schema copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSchema = () => {
    if (!result?.schema) return;
    const schemaString = JSON.stringify(result.schema, null, 2);
    const blob = new Blob([schemaString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${schemaType.toLowerCase()}-schema.json`;
    a.click();
  };

  const relatedTools = [
    { title: "Meta Optimizer", href: "/tools/meta-optimizer", description: "Optimize meta tags for AI" },
    { title: "AI FAQ Generator", href: "/tools/ai-faq-generator", description: "Generate FAQs with schema" },
    { title: "Content Auditor", href: "/tools/content-auditor", description: "Audit content for AI" },
  ];

  return (
    <ToolLayout
      title="JSON-LD Schema Generator"
      description="Generate valid JSON-LD schema markup to help search engines and AI understand your content better."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Generate Schema Markup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Schema Type</Label>
              <Select value={schemaType} onValueChange={setSchemaType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schemaTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="details">Business/Content Details *</Label>
              <Textarea
                id="details"
                placeholder={`Describe your ${schemaType.toLowerCase()} with relevant details:\n- Name, description\n- Contact info, address\n- Products/services offered\n- Social media links\n- Any other relevant information...`}
                value={businessDetails}
                onChange={(e) => setBusinessDetails(e.target.value)}
                rows={6}
              />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Schema...
                </>
              ) : (
                `Generate ${schemaType} Schema`
              )}
            </Button>
          </CardContent>
        </Card>

        {result && result.schema && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Generated JSON-LD Schema</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copySchema}>
                      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadSchema}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="preview">
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="code">Raw Code</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview">
                    <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm">
                        <code className="language-html">
                          {`<script type="application/ld+json">\n${JSON.stringify(result.schema, null, 2)}\n</script>`}
                        </code>
                      </pre>
                    </div>
                  </TabsContent>
                  <TabsContent value="code">
                    <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm">
                        <code>{JSON.stringify(result.schema, null, 2)}</code>
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Implementation Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{result.implementation}</p>
                
                {result.benefits && result.benefits.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Benefits:</h4>
                    <ul className="space-y-1">
                      {result.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.additionalSchemas && result.additionalSchemas.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Consider also adding:</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.additionalSchemas.map((schema, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          onClick={() => setSchemaType(schema)}
                        >
                          {schema}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default SchemaGenerator;
