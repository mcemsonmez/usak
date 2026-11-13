"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { createUnit } from "@/server/actions/properties";
import { Field, FormError } from "./field";

export function UnitForm({ propertyId }: { propertyId: string }) {
  const [state, action, pending] = useActionState(createUnit.bind(null, propertyId), undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const e = state?.fieldErrors;
  const v = state?.values;

  useEffect(() => {
    if (state && !state.error && !state.fieldErrors) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-3">
      <FormError error={state?.error} />
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
        <Field
          label="Unit label"
          name="label"
          defaultValue={v?.label}
          placeholder="Apt 4"
          errors={e?.label}
        />
        <Field
          label="Layout"
          name="rooms"
          defaultValue={v?.rooms}
          placeholder="2+kk"
          errors={e?.rooms}
        />
        <Field
          label="Area (m²)"
          name="areaM2"
          defaultValue={v?.areaM2}
          inputMode="numeric"
          errors={e?.areaM2}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add unit"}
        </Button>
      </div>
    </form>
  );
}
