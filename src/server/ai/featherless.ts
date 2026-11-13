import "server-only";

// Featherless is OpenAI-compatible: POST {base}/chat/completions.

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content:
    string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];
};

export type ChatResult = {
  content: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  httpStatus: number;
};

export const FEATHERLESS_BASE_URL = (
  process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1"
).replace(/\/$/, "");
export const VISION_MODEL =
  process.env.FEATHERLESS_VISION_MODEL || "Qwen/Qwen3-VL-30B-A3B-Instruct";

export class FeatherlessError extends Error {
  constructor(
    message: string,
    public httpStatus: number,
    public latencyMs: number,
  ) {
    super(message);
  }
}

export async function chatCompletion(params: {
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<ChatResult> {
  const key = process.env.FEATHERLESS_API_KEY;
  if (!key) throw new FeatherlessError("FEATHERLESS_API_KEY is not set", 0, 0);

  const started = Date.now();
  const res = await fetch(`${FEATHERLESS_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      max_tokens: params.maxTokens ?? 800,
      temperature: params.temperature ?? 0,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const latencyMs = Date.now() - started;
  const text = await res.text();
  if (!res.ok)
    throw new FeatherlessError(
      `Featherless HTTP ${res.status}: ${text.slice(0, 300)}`,
      res.status,
      latencyMs,
    );

  const json = JSON.parse(text);
  return {
    content: json.choices?.[0]?.message?.content ?? "",
    model: json.model ?? params.model,
    inputTokens: json.usage?.prompt_tokens ?? null,
    outputTokens: json.usage?.completion_tokens ?? null,
    latencyMs,
    httpStatus: res.status,
  };
}
