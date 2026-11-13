import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Conventions:
// - Every table has organizationId (single demo org for now, multi-tenant later).
// - Money is integer minor units (haléř for CZK). 100 = 1 CZK.
// - Calendar dates (lease start, due date) use `date`; moments use timestamptz (UTC).

const id = () => uuid("id").primaryKey().defaultRandom();
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
const orgId = () =>
  uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" });

// ---------- Enums ----------

export const propertyType = pgEnum("property_type", ["apartment", "house", "commercial"]);
export const unitStatus = pgEnum("unit_status", ["vacant", "occupied", "unavailable"]);
export const leaseStatus = pgEnum("lease_status", ["draft", "active", "ended"]);
export const chargeType = pgEnum("charge_type", ["rent", "service_charge", "deposit"]);
export const chargeStatus = pgEnum("charge_status", ["open", "partially_paid", "paid"]);
export const matchStatus = pgEnum("match_status", [
  "unmatched",
  "matched",
  "partial",
  "overpaid",
  "needs_review",
]);
export const maintenanceCategory = pgEnum("maintenance_category", [
  "plumbing",
  "electrical",
  "heating",
  "locks",
  "appliances",
  "general",
]);
export const maintenanceStatus = pgEnum("maintenance_status", ["new", "in_progress", "done"]);

// ---------- Tables ----------

export const organization = pgTable("organization", {
  id: id(),
  name: text("name").notNull(),
  country: text("country").notNull(), // ISO 3166-1 alpha-2, e.g. "CZ"
  currency: text("currency").notNull(), // ISO 4217, e.g. "CZK"
  locale: text("locale").notNull(), // e.g. "en-CZ"
  ...timestamps,
});

export const property = pgTable(
  "property",
  {
    id: id(),
    organizationId: orgId(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    type: propertyType("type").notNull().default("apartment"),
    ...timestamps,
  },
  (t) => [index("property_org_idx").on(t.organizationId)],
);

export const unit = pgTable(
  "unit",
  {
    id: id(),
    organizationId: orgId(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => property.id, { onDelete: "cascade" }),
    label: text("label").notNull(), // e.g. "Apt 2B"
    areaM2: integer("area_m2"),
    rooms: text("rooms"), // e.g. "2+kk"
    status: unitStatus("status").notNull().default("vacant"),
    ...timestamps,
  },
  (t) => [index("unit_property_idx").on(t.propertyId)],
);

export const tenant = pgTable(
  "tenant",
  {
    id: id(),
    organizationId: orgId(),
    fullName: text("full_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("tenant_org_idx").on(t.organizationId)],
);

export const lease = pgTable(
  "lease",
  {
    id: id(),
    organizationId: orgId(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => unit.id, { onDelete: "restrict" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "restrict" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"), // null = indefinite
    rentAmount: integer("rent_amount").notNull(), // minor units per month
    serviceChargeAmount: integer("service_charge_amount").notNull().default(0),
    depositAmount: integer("deposit_amount").notNull().default(0),
    dueDay: integer("due_day").notNull().default(15), // day of month rent is due
    variableSymbol: text("variable_symbol").notNull(), // payment reference used for matching
    status: leaseStatus("status").notNull().default("active"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("lease_org_vs_uq").on(t.organizationId, t.variableSymbol),
    index("lease_unit_idx").on(t.unitId),
  ],
);

export const charge = pgTable(
  "charge",
  {
    id: id(),
    organizationId: orgId(),
    leaseId: uuid("lease_id")
      .notNull()
      .references(() => lease.id, { onDelete: "cascade" }),
    period: text("period").notNull(), // "YYYY-MM"
    type: chargeType("type").notNull(),
    amount: integer("amount").notNull(),
    dueDate: date("due_date").notNull(),
    status: chargeStatus("status").notNull().default("open"),
    ...timestamps,
  },
  // One charge per lease, period and type: makes charge generation idempotent.
  (t) => [uniqueIndex("charge_lease_period_type_uq").on(t.leaseId, t.period, t.type)],
);

export const bankTransaction = pgTable(
  "bank_transaction",
  {
    id: id(),
    organizationId: orgId(),
    bookedOn: date("booked_on").notNull(),
    amount: integer("amount").notNull(), // positive = incoming
    counterAccount: text("counter_account"),
    counterName: text("counter_name"),
    variableSymbol: text("variable_symbol"),
    message: text("message"),
    importBatchId: uuid("import_batch_id").notNull(),
    importHash: text("import_hash").notNull(), // prevents importing the same row twice
    matchStatus: matchStatus("match_status").notNull().default("unmatched"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("bank_tx_org_hash_uq").on(t.organizationId, t.importHash),
    index("bank_tx_vs_idx").on(t.variableSymbol),
  ],
);

export const paymentAllocation = pgTable(
  "payment_allocation",
  {
    id: id(),
    organizationId: orgId(),
    bankTransactionId: uuid("bank_transaction_id")
      .notNull()
      .references(() => bankTransaction.id, { onDelete: "cascade" }),
    chargeId: uuid("charge_id")
      .notNull()
      .references(() => charge.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    ...timestamps,
  },
  (t) => [
    index("alloc_tx_idx").on(t.bankTransactionId),
    index("alloc_charge_idx").on(t.chargeId),
  ],
);

export const maintenanceRequest = pgTable(
  "maintenance_request",
  {
    id: id(),
    organizationId: orgId(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => unit.id, { onDelete: "cascade" }),
    category: maintenanceCategory("category").notNull().default("general"),
    description: text("description").notNull(),
    status: maintenanceStatus("status").notNull().default("new"),
    ...timestamps,
  },
  (t) => [index("maintenance_unit_idx").on(t.unitId)],
);

// ---------- Relations ----------

export const propertyRelations = relations(property, ({ many }) => ({ units: many(unit) }));

export const unitRelations = relations(unit, ({ one, many }) => ({
  property: one(property, { fields: [unit.propertyId], references: [property.id] }),
  leases: many(lease),
  maintenanceRequests: many(maintenanceRequest),
}));

export const tenantRelations = relations(tenant, ({ many }) => ({ leases: many(lease) }));

export const leaseRelations = relations(lease, ({ one, many }) => ({
  unit: one(unit, { fields: [lease.unitId], references: [unit.id] }),
  tenant: one(tenant, { fields: [lease.tenantId], references: [tenant.id] }),
  charges: many(charge),
}));

export const chargeRelations = relations(charge, ({ one, many }) => ({
  lease: one(lease, { fields: [charge.leaseId], references: [lease.id] }),
  allocations: many(paymentAllocation),
}));

export const bankTransactionRelations = relations(bankTransaction, ({ many }) => ({
  allocations: many(paymentAllocation),
}));

export const paymentAllocationRelations = relations(paymentAllocation, ({ one }) => ({
  bankTransaction: one(bankTransaction, {
    fields: [paymentAllocation.bankTransactionId],
    references: [bankTransaction.id],
  }),
  charge: one(charge, { fields: [paymentAllocation.chargeId], references: [charge.id] }),
}));

export const maintenanceRequestRelations = relations(maintenanceRequest, ({ one }) => ({
  unit: one(unit, { fields: [maintenanceRequest.unitId], references: [unit.id] }),
}));
