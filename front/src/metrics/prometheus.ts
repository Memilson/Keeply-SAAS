const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";

type MetricTags = {
  path?: string;
  source?: string;
};

function postMetric(metric: string, value: number, tags: MetricTags = {}) {
  const payload = JSON.stringify({
    metric,
    value,
    tags: {
      path: tags.path ?? window.location.pathname,
      source: tags.source ?? "web",
    },
  });

  const url = `${API_BASE_URL}/api/metrics/frontend`;

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }

    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  } catch {
    // Telemetria nunca deve quebrar a UI.
  }
}

export function reportPageView(path: string) {
  postMetric("page_view", 1, { path });
}

export function initFrontendPrometheusMetrics() {
  const navEntry = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;

  if (navEntry) {
    postMetric("page_load_ms", navEntry.loadEventEnd || navEntry.duration);
  } else {
    window.addEventListener(
      "load",
      () => {
        postMetric("page_load_ms", performance.now());
      },
      { once: true }
    );
  }

  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          postMetric("lcp_ms", last.startTime);
        }
      });

      observer.observe({ type: "largest-contentful-paint", buffered: true });
      window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
    } catch {
      // Alguns navegadores bloqueiam tipos de entrada específicos.
    }
  }
}
