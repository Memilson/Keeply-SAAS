import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initFrontendPrometheusMetrics } from "./metrics/prometheus";

initFrontendPrometheusMetrics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
