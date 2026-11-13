"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createProperty } from "@/server/actions/properties";
import { Field, FormError, SelectField } from "./field";

export function PropertyForm() {
  const [state, action, pending] = useActionState(createProperty, undefined);
  const e = state?.fieldErrors;
  const v = state?.values;
  return (
    <form action={action} className="grid gap-4">
      <FormError error={state?.error} />
      <Field
        label="Name"
        name="name"
        defaultValue={v?.name}
        placeholder="Vinohrady Residence"
        errors={e?.name}
      />
      <Field
        label="Address"
        name="address"
        defaultValue={v?.address}
        placeholder="Mánesova 1442/28"
        errors={e?.address}
      />
      <Field
        label="City / district"
        name="city"
        defaultValue={v?.city}
        placeholder="Praha 2"
        errors={e?.city}
      />
      <SelectField
        label="Type"
        name="type"
        defaultValue={v?.type}
        errors={e?.type}
        options={[
          { value: "apartment", label: "Apartment building" },
          { value: "house", label: "House" },
          { value: "commercial", label: "Commercial" },
        ]}
      />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Create property"}
      </Button>
    </form>
  );
}
