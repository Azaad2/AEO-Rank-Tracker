import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_scans",
  title: "List my recent AI visibility scans",
  description: "List the signed-in user's most recent AI visibility scans (id, domain, score, created_at).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("How many scans to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true },
  handler: async ({ limit }, ctx: ToolContext) => {
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
    const { data, error } = await supabase
      .from("scans")
      .select("id, project_domain, score, market, created_at, is_auto_scan")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { scans: data ?? [] },
    };
  },
});
