"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CATEGORY_OPTIONS } from "@/lib/maintenance";
import { createMaintenanceRequest } from "@/server/actions/maintenance";
import { Field, FormError, SelectField } from "./field";

export function MaintenanceRequestForm({ units }: { units: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState(createMaintenanceRequest, undefined);
  const ref = useRef<HTMLFormElement>(null);
  const e = state?.fieldErrors;
  const v = state?.values;
  useEffect(() => {
    if (state && !state.error && !state.fieldErrors) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-3">
      <FormError error={state?.error} />
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <SelectField
          label="Unit"
          name="unitId"
          placeholder="Pick a unit"
          options={units}
          defaultValue={v?.unitId}
          errors={e?.unitId}
        />
        <SelectField
          label="Category"
          name="category"
          options={CATEGORY_OPTIONS}
          defaultValue={v?.category}
          errors={e?.category}
        />
      </div>
      <Field
        label="What is wrong?"
        name="description"
        defaultValue={v?.description}
        errors={e?.description}
      />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Report issue"}
      </Button>
    </form>
  );
}
