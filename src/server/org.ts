import "server-only";
import { cache } from "react";
import { db } from "@/db";
import { organization } from "@/db/schema";

/** Single demo organization for now (no auth). Every query still filters by it. */
export const getOrgId = cache(async (): Promise<string> => {
  const [org] = await db.select({ id: organization.id }).from(organization).limit(1);
  if (!org) throw new Error("No organization found. Run `pnpm db:seed`.");
  return org.id;
});
