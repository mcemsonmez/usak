"use server";

import { extractLeaseFromImage } from "@/server/ai/extract-lease";
import type { LeaseExtraction } from "@/server/ai/lease-extraction";

export type ExtractState =
  | {
      error?: string;
      extraction?: LeaseExtraction;
      model?: string;
      latencyMs?: number;
      fileName?: string;
    }
  | undefined;

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Reads a lease image with a vision model. Nothing is saved; the user reviews the result first. */
export async function extractLeaseAction(
  _prev: ExtractState,
  formData: FormData,
): Promise<ExtractState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a lease document" };
  if (file.type === "application/pdf")
    return { error: "PDF is not supported yet. Upload a photo or scan (PNG or JPG)." };
  if (!IMAGE_TYPES.includes(file.type)) return { error: "Upload a PNG, JPG or WebP image" };
  if (file.size > 5_000_000) return { error: "Image is too large (max 5 MB)" };

  const dataUrl = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
  try {
    const { extraction, model, latencyMs } = await extractLeaseFromImage(dataUrl);
    return { extraction, model, latencyMs, fileName: file.name };
  } catch (e) {
    console.error("[lease extraction]", e);
    return { error: `AI extraction failed: ${(e as Error).message}` };
  }
}
