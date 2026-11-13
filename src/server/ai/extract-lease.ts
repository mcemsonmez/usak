import "server-only";
import { randomUUID } from "node:crypto";
import {
  chatCompletion,
  FEATHERLESS_BASE_URL,
  FeatherlessError,
  VISION_MODEL,
} from "./featherless";
import {
  LEASE_EXTRACTION_PROMPT,
  type LeaseExtraction,
  parseLeaseExtraction,
} from "./lease-extraction";
import { captureAiGeneration } from "./posthog";

export async function extractLeaseFromImage(
  dataUrl: string,
): Promise<{ extraction: LeaseExtraction; model: string; latencyMs: number }> {
  const traceId = randomUUID();
  const messages = [
    { role: "system" as const, content: LEASE_EXTRACTION_PROMPT },
    {
      role: "user" as const,
      content: [
        { type: "text" as const, text: "Extract the lease data from this document." },
        { type: "image_url" as const, image_url: { url: dataUrl } },
      ],
    },
  ];
  // Never send the image itself to analytics.
  const loggedInput = [
    { role: "system", content: LEASE_EXTRACTION_PROMPT },
    { role: "user", content: "Extract the lease data from this document. [image]" },
  ];
  const base = {
    traceId,
    feature: "lease_extraction",
    provider: "featherless",
    baseUrl: FEATHERLESS_BASE_URL,
    input: loggedInput,
  };

  try {
    const res = await chatCompletion({ model: VISION_MODEL, messages, maxTokens: 600 });
    try {
      const extraction = parseLeaseExtraction(res.content);
      await captureAiGeneration({ ...base, ...res, output: res.content });
      return { extraction, model: res.model, latencyMs: res.latencyMs };
    } catch (e) {
      const error = `Could not read the model's answer: ${(e as Error).message}`;
      await captureAiGeneration({ ...base, ...res, output: res.content, error });
      throw new Error(error);
    }
  } catch (e) {
    if (e instanceof FeatherlessError) {
      await captureAiGeneration({
        ...base,
        model: VISION_MODEL,
        output: null,
        inputTokens: null,
        outputTokens: null,
        latencyMs: e.latencyMs,
        httpStatus: e.httpStatus,
        error: e.message,
      });
    }
    throw e;
  }
}
