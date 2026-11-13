import { z } from "zod";
import { parseMoney } from "./money";

export type FormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string[] | undefined>;
      /** Submitted values, so the form can be refilled after an error. */
      values?: Record<string, string | undefined>;
    }
  | undefined;

export function fieldErrors(
  error: z.ZodError,
  values?: Record<string, string | undefined>,
): FormState {
  return { fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>, values };
}

/** Empty form fields become undefined so optional fields validate. */
export function formToObject(formData: FormData): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") out[k] = v.trim() === "" ? undefined : v.trim();
  }
  return out;
}

export const moneyField = z.string().transform((v, ctx) => {
  try {
    return parseMoney(v);
  } catch {
    ctx.addIssue({ code: "custom", message: "Enter an amount like 18 500 or 18500.50" });
    return z.NEVER;
  }
});

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date");

/** Floor area as people type it: "52", "47,5", "47.5 m2", "52 m²". Stored as whole m². */
export const areaField = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const n = Number(
      v
        .replace(/m2|m²|sqm/gi, "")
        .replace(/\s/g, "")
        .replace(",", "."),
    );
    if (!Number.isFinite(n) || n <= 0 || n > 10_000) {
      ctx.addIssue({ code: "custom", message: "Enter the area in m², for example 52 or 47,5" });
      return z.NEVER;
    }
    return Math.round(n);
  });
