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
