import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_scan",
  title: "Get a scan by ID",
  description:
    "Fetch a single AI visibility scan by ID, including per-prompt results (mentions, citations, competitors).",
  inputSchema: {
    scanId: z.string().uuid().describe("The scan's UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true },
  handler: async ({ scanId }, ctx: ToolContext) => {
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
    const { data: scan, error } = await supabase
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!scan) return { content: [{ type: "text", text: "Scan not found" }], isError: true };

    const { data: results } = await supabase
      .from("scan_results")
      .select("*")
      .eq("scan_id", scanId);

    const payload = { scan, results: results ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload).slice(0, 8000) }],
      structuredContent: payload,
    };
  },
});
