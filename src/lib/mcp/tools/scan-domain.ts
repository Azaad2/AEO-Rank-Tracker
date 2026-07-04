import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

const DEFAULT_PROMPTS = [
  "What are the best tools to check AI search visibility?",
  "Which platforms track brand mentions in ChatGPT and Perplexity?",
  "Top AI visibility monitoring tools for SaaS companies",
];

export default defineTool({
  name: "scan_domain",
  title: "Scan a domain for AI visibility",
  description:
    "Run an AI visibility scan for a domain against ChatGPT, Gemini, Perplexity and web search. Returns the score, per-prompt mentions and citations, and top competitors.",
  inputSchema: {
    domain: z.string().min(3).describe("The domain to scan, e.g. example.com"),
    prompts: z
      .array(z.string().min(3))
      .max(10)
      .optional()
      .describe("Optional list of prompts to test (max 10). Defaults to a small built-in prompt set."),
    market: z.string().optional().describe("Market/locale code, e.g. 'us' or 'gb'. Defaults to 'us'."),
  },
  annotations: { readOnlyHint: false, openWorldHint: true },
  handler: async ({ domain, prompts, market }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );

    const promptsText = (prompts && prompts.length ? prompts : DEFAULT_PROMPTS).join("\n");

    const { data, error } = await supabase.functions.invoke("scan", {
      body: { domain, promptsText, market: market ?? "us" },
    });

    if (error) {
      return { content: [{ type: "text", text: `Scan failed: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data).slice(0, 8000) }],
      structuredContent: { scan: data },
    };
  },
});
