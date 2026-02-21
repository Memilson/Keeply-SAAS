package com.keeply.web;

import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/metrics")
@Validated
public class FrontendMetricsController {

    private static final Pattern METRIC_NAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_\\-]{1,64}$");
    private static final List<String> ALLOWED_TAG_KEYS = List.of("path", "source");

    private final MeterRegistry meterRegistry;

    public FrontendMetricsController(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @PostMapping("/frontend")
    public ResponseEntity<?> ingestFrontendMetric(@RequestBody FrontendMetricRequest request) {
        if (!METRIC_NAME_PATTERN.matcher(request.metric()).matches()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", true,
                    "message", "Nome de metrica invalido."
            ));
        }

        double value = request.value() == null ? 1.0 : request.value();
        if (Double.isNaN(value) || Double.isInfinite(value) || value < 0) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", true,
                    "message", "Valor de metrica invalido."
            ));
        }

        Map<String, String> tags = sanitizeTags(request.tags());

        meterRegistry.counter("keeply_frontend_events_total",
                "metric", request.metric(),
                "path", tags.get("path"),
                "source", tags.get("source")
        ).increment();

        DistributionSummary.builder("keeply_frontend_metric_value")
                .description("Metrica numerica enviada pelo frontend")
                .baseUnit("milliseconds")
                .tag("metric", request.metric())
                .tag("path", tags.get("path"))
                .tag("source", tags.get("source"))
                .register(meterRegistry)
                .record(value);

        return ResponseEntity.accepted().body(Map.of("ok", true));
    }

    private Map<String, String> sanitizeTags(Map<String, String> incoming) {
        Map<String, String> tags = new LinkedHashMap<>();
        tags.put("path", "unknown");
        tags.put("source", "web");

        if (incoming == null) return tags;

        for (String key : ALLOWED_TAG_KEYS) {
            String raw = incoming.get(key);
            if (raw == null || raw.isBlank()) continue;
            String cleaned = raw.trim();
            if (cleaned.length() > 64) cleaned = cleaned.substring(0, 64);
            tags.put(key, cleaned);
        }

        return tags;
    }

    public record FrontendMetricRequest(
            @NotBlank String metric,
            @NotNull Double value,
            Map<String, String> tags
    ) {}
}
