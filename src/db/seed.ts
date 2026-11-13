// Seeds a demo organization in Prague (CZK). Wipes existing data first.
// Run: pnpm db:seed
import "dotenv/config";
import { sql } from "drizzle-orm";
import { periodOf, shiftPeriod } from "../server/billing/charges";
import { generateCharges } from "../server/billing/generate";
import { db } from "./index";
import { lease, maintenanceRequest, organization, property, tenant, unit } from "./schema";

const czk = (amount: number) => Math.round(amount * 100); // CZK -> haléř

async function main() {
  await db.execute(sql`
    truncate table payment_allocation, bank_transaction, charge, maintenance_request,
      lease, tenant, unit, property, organization restart identity cascade
  `);

  const [org] = await db
    .insert(organization)
    .values({ name: "Demo Properties s.r.o.", country: "CZ", currency: "CZK", locale: "en-CZ" })
    .returning();
  const organizationId = org.id;

  const [vinohrady, karlin, smichov] = await db
    .insert(property)
    .values([
      {
        organizationId,
        name: "Vinohrady Residence",
        address: "Mánesova 1442/28",
        city: "Praha 2",
        type: "apartment",
      },
      {
        organizationId,
        name: "Karlín Lofts",
        address: "Křižíkova 488/115",
        city: "Praha 8",
        type: "apartment",
      },
      {
        organizationId,
        name: "Smíchov Shop",
        address: "Štefánikova 232/24",
        city: "Praha 5",
        type: "commercial",
      },
    ])
    .returning();

  const units = await db
    .insert(unit)
    .values([
      {
        organizationId,
        propertyId: vinohrady.id,
        label: "Apt 1",
        areaM2: 54,
        rooms: "2+kk",
        status: "occupied",
      },
      {
        organizationId,
        propertyId: vinohrady.id,
        label: "Apt 2",
        areaM2: 72,
        rooms: "3+1",
        status: "occupied",
      },
      {
        organizationId,
        propertyId: vinohrady.id,
        label: "Apt 3",
        areaM2: 38,
        rooms: "1+kk",
        status: "occupied",
      },
      {
        organizationId,
        propertyId: karlin.id,
        label: "Loft A",
        areaM2: 85,
        rooms: "3+kk",
        status: "occupied",
      },
      {
        organizationId,
        propertyId: karlin.id,
        label: "Loft B",
        areaM2: 61,
        rooms: "2+kk",
        status: "occupied",
      },
      {
        organizationId,
        propertyId: karlin.id,
        label: "Loft C",
        areaM2: 47,
        rooms: "1+kk",
        status: "vacant",
      },
      {
        organizationId,
        propertyId: smichov.id,
        label: "Ground floor shop",
        areaM2: 110,
        rooms: null,
        status: "occupied",
      },
    ])
    .returning();
  const u = Object.fromEntries(units.map((x) => [x.label, x]));

  const tenants = await db
    .insert(tenant)
    .values([
      {
        organizationId,
        fullName: "Jana Nováková",
        email: "jana.novakova@example.com",
        phone: "+420 601 111 222",
      },
      {
        organizationId,
        fullName: "Petr Svoboda",
        email: "petr.svoboda@example.com",
        phone: "+420 602 333 444",
      },
      {
        organizationId,
        fullName: "Lucie Dvořáková",
        email: "lucie.dvorakova@example.com",
        phone: "+420 603 555 666",
      },
      {
        organizationId,
        fullName: "Tomáš Černý",
        email: "tomas.cerny@example.com",
        phone: "+420 604 777 888",
      },
      {
        organizationId,
        fullName: "Eva Procházková",
        email: "eva.prochazkova@example.com",
        phone: "+420 605 999 000",
      },
      {
        organizationId,
        fullName: "Kavárna Anděl s.r.o.",
        email: "info@kavarna-andel.example.com",
        phone: "+420 606 121 212",
        notes: "Commercial tenant (café)",
      },
    ])
    .returning();
  const t = Object.fromEntries(tenants.map((x) => [x.fullName, x]));

  await db.insert(lease).values([
    {
      organizationId,
      unitId: u["Apt 1"].id,
      tenantId: t["Jana Nováková"].id,
      startDate: "2025-03-01",
      endDate: "2027-02-28",
      rentAmount: czk(18500),
      serviceChargeAmount: czk(3200),
      depositAmount: czk(37000),
      dueDay: 15,
      variableSymbol: "2025001",
    },
    {
      organizationId,
      unitId: u["Apt 2"].id,
      tenantId: t["Petr Svoboda"].id,
      startDate: "2024-09-01",
      endDate: "2026-12-31",
      rentAmount: czk(24000),
      serviceChargeAmount: czk(4100),
      depositAmount: czk(48000),
      dueDay: 15,
      variableSymbol: "2024002",
    },
    {
      organizationId,
      unitId: u["Apt 3"].id,
      tenantId: t["Lucie Dvořáková"].id,
      startDate: "2026-11-10",
      endDate: "2027-11-09",
      rentAmount: czk(14500),
      serviceChargeAmount: czk(2500),
      depositAmount: czk(29000),
      dueDay: 10,
      variableSymbol: "2026003",
    },
    {
      organizationId,
      unitId: u["Loft A"].id,
      tenantId: t["Tomáš Černý"].id,
      startDate: "2025-06-01",
      endDate: null,
      rentAmount: czk(29900),
      serviceChargeAmount: czk(4800),
      depositAmount: czk(59800),
      dueDay: 20,
      variableSymbol: "2025004",
    },
    {
      organizationId,
      unitId: u["Loft B"].id,
      tenantId: t["Eva Procházková"].id,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      rentAmount: czk(21000),
      serviceChargeAmount: czk(3500),
      depositAmount: czk(42000),
      dueDay: 15,
      variableSymbol: "2026005",
    },
    {
      organizationId,
      unitId: u["Ground floor shop"].id,
      tenantId: t["Kavárna Anděl s.r.o."].id,
      startDate: "2023-04-01",
      endDate: "2028-03-31",
      rentAmount: czk(45000),
      serviceChargeAmount: czk(6000),
      depositAmount: czk(135000),
      dueDay: 5,
      variableSymbol: "2023006",
    },
  ]);

  await db.insert(maintenanceRequest).values([
    {
      organizationId,
      unitId: u["Apt 2"].id,
      category: "plumbing",
      description: "Kitchen sink is leaking under the cabinet.",
      status: "new",
    },
    {
      organizationId,
      unitId: u["Loft A"].id,
      category: "heating",
      description: "Radiator in the bedroom does not heat up.",
      status: "in_progress",
    },
  ]);

  // Charges for the two previous months. The current month is left for the
  // "Generate charges" button in the demo.
  const current = periodOf(new Date().toISOString().slice(0, 10));
  for (const period of [shiftPeriod(current, -2), shiftPeriod(current, -1)]) {
    const { created } = await generateCharges(db, organizationId, period);
    console.log(`Charges for ${period}: ${created}`);
  }

  console.log(
    "Seeded: 1 organization, 3 properties, 7 units, 6 tenants, 6 leases, 2 maintenance requests",
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
