"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createLease } from "@/server/actions/leases";
import { Field, FormError, SelectField } from "./field";

type Option = { value: string; label: string };

export function LeaseForm({
  units,
  tenants,
  defaultUnitId,
}: {
  units: Option[];
  tenants: Option[];
  defaultUnitId?: string;
}) {
  const [state, action, pending] = useActionState(createLease, undefined);
  const e = state?.fieldErrors;
  const v = state?.values;
  return (
    <form action={action} className="grid max-w-2xl gap-4">
      <FormError error={state?.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Unit"
          name="unitId"
          placeholder="Pick a unit"
          options={units}
          defaultValue={v?.unitId ?? defaultUnitId}
          errors={e?.unitId}
        />
        <SelectField
          label="Tenant"
          name="tenantId"
          defaultValue={v?.tenantId}
          placeholder="Pick a tenant"
          options={tenants}
          errors={e?.tenantId}
        />
        <Field
          label="Start date"
          name="startDate"
          defaultValue={v?.startDate}
          type="date"
          errors={e?.startDate}
        />
        <Field
          label="End date"
          name="endDate"
          defaultValue={v?.endDate}
          type="date"
          hint="Leave empty for an indefinite lease"
          errors={e?.endDate}
        />
        <Field
          label="Monthly rent (CZK)"
          name="rentAmount"
          defaultValue={v?.rentAmount}
          inputMode="decimal"
          errors={e?.rentAmount}
        />
        <Field
          label="Service charges (CZK / month)"
          name="serviceChargeAmount"
          defaultValue={v?.serviceChargeAmount}
          inputMode="decimal"
          errors={e?.serviceChargeAmount}
        />
        <Field
          label="Deposit (CZK)"
          name="depositAmount"
          defaultValue={v?.depositAmount}
          inputMode="decimal"
          errors={e?.depositAmount}
        />
        <Field
          label="Due day of month"
          name="dueDay"
          type="number"
          min={1}
          max={28}
          defaultValue={v?.dueDay ?? 15}
          errors={e?.dueDay}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        A unique variable symbol (payment reference) is generated automatically.
      </p>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Create lease"}
      </Button>
    </form>
  );
}
