import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPostHog } from "./lib/posthog";
import { installGlobalErrorHandlers } from "./lib/errorLogger";

initPostHog();
installGlobalErrorHandlers();

createRoot(document.getElementById("root")!).render(<App />);
