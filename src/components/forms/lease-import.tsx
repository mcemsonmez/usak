"use client";

import { useActionState, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { extractLeaseAction } from "@/server/actions/ai";
import { createLeaseFromReview } from "@/server/actions/leases";
import { guessTenantId, guessUnitId, type LeaseExtraction } from "@/server/ai/lease-extraction";
import { Field, FormError, SelectField } from "./field";

type UnitOption = {
  id: string;
  label: string;
  propertyName: string;
  address: string;
  vacant: boolean;
};
type TenantOption = { id: string; fullName: string };

export function LeaseImport({ units, tenants }: { units: UnitOption[]; tenants: TenantOption[] }) {
  const [state, action, pending] = useActionState(extractLeaseAction, undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => setDismissed(false), [state]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const extraction = !dismissed ? state?.extraction : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader>
          <CardTitle>1. Upload the lease</CardTitle>
          <CardDescription>
            A photo or scan (PNG/JPG). The AI reads it; nothing is saved until you approve.{" "}
            <a href="/samples/sample-lease.png" download className="underline">
              Download a sample lease
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={action} className="grid gap-3">
            <FormError error={state?.error} />
            <Input
              type="file"
              name="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              aria-label="Lease document"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setPreview(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
              }}
            />
            <Button type="submit" disabled={pending} className="w-fit">
              {pending ? "Reading the document…" : "Read with AI"}
            </Button>
            {pending && (
              <p className="text-muted-foreground text-xs">This usually takes 5–20 seconds.</p>
            )}
          </form>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Uploaded lease"
              className="max-h-[480px] w-full rounded-md border object-contain"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Check and approve</CardTitle>
          <CardDescription>
            {extraction ? (
              <>
                Filled in by AI from <span className="font-medium">{state?.fileName}</span> (
                {state?.model}, {((state?.latencyMs ?? 0) / 1000).toFixed(1)} s). Check every field
                before saving.
              </>
            ) : (
              "The extracted details will appear here."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {extraction ? (
            <ReviewForm
              key={JSON.stringify(extraction)}
              extraction={extraction}
              units={units}
              tenants={tenants}
              onCancel={() => setDismissed(true)}
            />
          ) : (
            <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
              Upload a lease and click “Read with AI”.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewForm({
  extraction: x,
  units,
  tenants,
  onCancel,
}: {
  extraction: LeaseExtraction;
  units: UnitOption[];
  tenants: TenantOption[];
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(createLeaseFromReview, undefined);
  const e = state?.fieldErrors;
  const v = state?.values;
  const guessedTenant = guessTenantId(x.tenantName, tenants);
  const guessedUnit = guessUnitId(x, units);
  const [tenantChoice, setTenantChoice] = useState(v?.tenantId ?? guessedTenant ?? "new");
  const money = (n: number | null) => (n === null ? undefined : String(n));

  return (
    <form action={action} className="grid gap-4">
      <FormError error={state?.error} />
      {x.currency && x.currency !== "CZK" && (
        <FormError error={`The lease is in ${x.currency}; amounts below are saved as CZK.`} />
      )}

      <fieldset className="grid gap-3 rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">Tenant</legend>
        <SelectField
          label="Tenant"
          name="tenantId"
          value={tenantChoice}
          onChange={(ev) => setTenantChoice(ev.target.value)}
          options={[
            { value: "new", label: `New tenant${x.tenantName ? `: ${x.tenantName}` : ""}` },
            ...tenants.map((t) => ({ value: t.id, label: t.fullName })),
          ]}
          errors={e?.tenantId}
        />
        {guessedTenant && (
          <p className="text-muted-foreground -mt-1 text-xs">Matched an existing tenant by name.</p>
        )}
        {tenantChoice === "new" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field
              label="Full name"
              name="newTenantName"
              defaultValue={v?.newTenantName ?? x.tenantName ?? ""}
              errors={e?.newTenantName}
            />
            <Field
              label="Email"
              name="newTenantEmail"
              type="email"
              defaultValue={v?.newTenantEmail ?? x.tenantEmail ?? ""}
              errors={e?.newTenantEmail}
            />
            <Field
              label="Phone"
              name="newTenantPhone"
              defaultValue={v?.newTenantPhone ?? x.tenantPhone ?? ""}
              errors={e?.newTenantPhone}
            />
          </div>
        )}
      </fieldset>

      <fieldset className="grid gap-3 rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">Unit</legend>
        <SelectField
          label="Unit"
          name="unitId"
          placeholder="Pick a unit"
          defaultValue={v?.unitId ?? guessedUnit ?? ""}
          options={units.map((u) => ({
            value: u.id,
            label: `${u.propertyName} · ${u.label}${u.vacant ? " (vacant)" : ""}`,
          }))}
          errors={e?.unitId}
        />
        <p className="text-muted-foreground -mt-1 text-xs">
          In the document:{" "}
          {[x.propertyName, x.propertyAddress, x.unitLabel].filter(Boolean).join(", ") ||
            "not found"}
          {guessedUnit ? (
            <Badge variant="outline" className="ml-2">
              matched
            </Badge>
          ) : null}
        </p>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Start date"
          name="startDate"
          type="date"
          defaultValue={v?.startDate ?? x.startDate ?? ""}
          errors={e?.startDate}
        />
        <Field
          label="End date"
          name="endDate"
          type="date"
          defaultValue={v?.endDate ?? x.endDate ?? ""}
          hint="Empty = indefinite"
          errors={e?.endDate}
        />
        <Field
          label="Monthly rent (CZK)"
          name="rentAmount"
          inputMode="decimal"
          defaultValue={v?.rentAmount ?? money(x.monthlyRent)}
          errors={e?.rentAmount}
        />
        <Field
          label="Service charges (CZK / month)"
          name="serviceChargeAmount"
          inputMode="decimal"
          defaultValue={v?.serviceChargeAmount ?? money(x.monthlyServiceCharges)}
          errors={e?.serviceChargeAmount}
        />
        <Field
          label="Deposit (CZK)"
          name="depositAmount"
          inputMode="decimal"
          defaultValue={v?.depositAmount ?? money(x.deposit)}
          errors={e?.depositAmount}
        />
        <Field
          label="Due day of month"
          name="dueDay"
          type="number"
          min={1}
          max={28}
          defaultValue={v?.dueDay ?? String(x.dueDay ?? 15)}
          errors={e?.dueDay}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Approve and save lease"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Discard
        </Button>
      </div>
    </form>
  );
}
