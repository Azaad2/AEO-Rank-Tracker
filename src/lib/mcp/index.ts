import { auth, defineMcp } from "@lovable.dev/mcp-js";
import scanDomainTool from "./tools/scan-domain";
import listScansTool from "./tools/list-scans";
import getScanTool from "./tools/get-scan";
import listSavedDomainsTool from "./tools/list-saved-domains";

// The OAuth issuer must be the direct Supabase host, built from the project ref
// (Vite inlines VITE_SUPABASE_PROJECT_ID as a literal, so this stays import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ai-mention-you-mcp",
  title: "AI Mention You",
  version: "0.1.0",
  instructions:
    "Tools for AI Mention You. Run and read AI visibility scans (ChatGPT, Gemini, Perplexity) for the signed-in user's domains, and list their saved domains and past scans.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [scanDomainTool, listScansTool, getScanTool, listSavedDomainsTool],
});
