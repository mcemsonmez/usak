import "server-only";
import { PostHog } from "posthog-node";

let client: PostHog | null | undefined;

function getClient(): PostHog | null {
  if (client !== undefined) return client;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  client = key
    ? new PostHog(key, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        flushAt: 1,
        flushInterval: 0,
      })
    : null;
  return client;
}

/** PostHog LLM Analytics: one `$ai_generation` event per model call. Never throws. */
export async function captureAiGeneration(e: {
  traceId: string;
  feature: string;
  model: string;
  provider: string;
  baseUrl: string;
  input: unknown;
  output: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  httpStatus: number;
  error?: string;
}) {
  const ph = getClient();
  if (!ph) return;
  try {
    ph.capture({
      distinctId: "demo-organization",
      event: "$ai_generation",
      properties: {
        $ai_trace_id: e.traceId,
        $ai_span_name: e.feature,
        $ai_model: e.model,
        $ai_provider: e.provider,
        $ai_base_url: e.baseUrl,
        $ai_input: e.input,
        $ai_output_choices: e.output === null ? [] : [{ role: "assistant", content: e.output }],
        $ai_input_tokens: e.inputTokens,
        $ai_output_tokens: e.outputTokens,
        $ai_latency: e.latencyMs / 1000,
        $ai_http_status: e.httpStatus,
        $ai_is_error: !!e.error,
        $ai_error: e.error,
        feature: e.feature,
      },
    });
    await ph.flush();
  } catch (err) {
    console.warn("[posthog] failed to capture $ai_generation", err);
  }
}
