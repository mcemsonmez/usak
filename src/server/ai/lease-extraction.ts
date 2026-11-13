// Parsing and validation of the model's answer. Pure, so it can be tested.
import { z } from "zod";

const nullableString = z
  .string()
  .nullish()
  .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null));

const isoDateOrNull = nullableString.transform((v) =>
  v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null,
);

/** Accepts 16900, "16900", "16 900", "16 900 CZK", "16,900.00". Returns CZK as a number. */
const amountOrNull = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((v) => {
    if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? v : null;
    if (typeof v !== "string") return null;
    let s = v.replace(/[^\d.,]/g, "");
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
    else s = s.replace(",", ".");
    const n = Number(s);
    return s && Number.isFinite(n) ? n : null;
  });

export const leaseExtractionSchema = z.object({
  tenantName: nullableString,
  tenantEmail: nullableString,
  tenantPhone: nullableString,
  propertyName: nullableString,
  propertyAddress: nullableString,
  unitLabel: nullableString,
  startDate: isoDateOrNull,
  endDate: isoDateOrNull,
  monthlyRent: amountOrNull,
  monthlyServiceCharges: amountOrNull,
  deposit: amountOrNull,
  dueDay: z
    .union([z.number(), z.string()])
    .nullish()
    .transform((v) => {
      const n = typeof v === "string" ? parseInt(v, 10) : v;
      return typeof n === "number" && n >= 1 && n <= 31 ? Math.min(n, 28) : null;
    }),
  currency: nullableString,
});

export type LeaseExtraction = z.infer<typeof leaseExtractionSchema>;

export const LEASE_EXTRACTION_PROMPT = `You read residential lease agreements (often Czech) and extract data.
Return ONLY a JSON object, no explanation, with exactly these keys:
{
  "tenantName": string|null,
  "tenantEmail": string|null,
  "tenantPhone": string|null,
  "propertyName": string|null,     // building or property name if stated
  "propertyAddress": string|null,
  "unitLabel": string|null,        // e.g. "Loft C", "Apt 2", "byt č. 5"
  "startDate": "YYYY-MM-DD"|null,
  "endDate": "YYYY-MM-DD"|null,    // null if indefinite
  "monthlyRent": number|null,      // in the contract currency, without services
  "monthlyServiceCharges": number|null, // monthly advances for services / utilities
  "deposit": number|null,
  "dueDay": number|null,           // day of month rent is due
  "currency": string|null          // ISO code, e.g. "CZK"
}
Use null when a value is not in the document. Do not guess.`;

/** Pull the JSON object out of a model answer (handles ```json fences and extra text). */
export function parseLeaseExtraction(content: string): LeaseExtraction {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : content;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The model did not return JSON");
  const json = JSON.parse(raw.slice(start, end + 1));
  return leaseExtractionSchema.parse(json);
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Best unit for the extracted text: unit label must match, property name/address breaks ties. */
export function guessUnitId(
  extraction: Pick<LeaseExtraction, "unitLabel" | "propertyName" | "propertyAddress">,
  units: { id: string; label: string; propertyName: string; address: string }[],
): string | null {
  if (!extraction.unitLabel) return null;
  const label = norm(extraction.unitLabel);
  const where = norm(`${extraction.propertyName ?? ""} ${extraction.propertyAddress ?? ""}`);
  const scored = units
    .filter((u) => label.includes(norm(u.label)) || norm(u.label).includes(label))
    .map((u) => ({
      id: u.id,
      score:
        (where.includes(norm(u.propertyName)) ? 2 : 0) + (where.includes(norm(u.address)) ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.id ?? null;
}

export function guessTenantId(
  name: string | null,
  tenants: { id: string; fullName: string }[],
): string | null {
  if (!name) return null;
  return tenants.find((t) => norm(t.fullName) === norm(name))?.id ?? null;
}
