"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createTenant } from "@/server/actions/tenants";
import { Field, FormError } from "./field";

export function TenantForm() {
  const [state, action, pending] = useActionState(createTenant, undefined);
  const e = state?.fieldErrors;
  const v = state?.values;
  return (
    <form action={action} className="grid max-w-lg gap-4">
      <FormError error={state?.error} />
      <Field
        label="Full name / company"
        name="fullName"
        defaultValue={v?.fullName}
        errors={e?.fullName}
      />
      <Field label="Email" name="email" defaultValue={v?.email} type="email" errors={e?.email} />
      <Field
        label="Phone"
        name="phone"
        defaultValue={v?.phone}
        placeholder="+420 …"
        errors={e?.phone}
      />
      <Field label="Notes" name="notes" defaultValue={v?.notes} errors={e?.notes} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Create tenant"}
      </Button>
    </form>
  );
}
