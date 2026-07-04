/// <reference types="vite/client" />

// Files under src/lib/mcp are bundled into a Deno edge function by the MCP
// plugin, where `process.env` is provided. Declare it for the TS check.
declare const process: { env: Record<string, string | undefined> };
