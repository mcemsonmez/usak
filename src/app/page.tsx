import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

async function dbStatus() {
  try {
    const [row] = await db.execute<{ version: string }>(sql`select version()`);
    return { ok: true, detail: row.version.split(" ").slice(0, 2).join(" ") };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "unknown error" };
  }
}

export default async function Home() {
  const status = await dbStatus();
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold">usak</h1>
      <p className="text-muted-foreground">
        Who owes how much, for which property, and have they paid?
      </p>
      <p className="text-sm">
        Database:{" "}
        <span className={status.ok ? "text-green-600" : "text-red-600"}>
          {status.ok ? "connected" : "not connected"}
        </span>{" "}
        <span className="text-muted-foreground">({status.detail})</span>
      </p>
    </main>
  );
}
