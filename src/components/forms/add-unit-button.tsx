"use client";

import { FormDialog } from "./form-dialog";
import { UnitForm } from "./unit-form";

export function AddUnitButton({ propertyId }: { propertyId: string }) {
  return (
    <FormDialog
      label="Add unit"
      title="Add a unit"
      description="A flat, loft or shop inside this property."
      size="sm"
      variant="outline"
    >
      {(close) => <UnitForm propertyId={propertyId} onSuccess={close} />}
    </FormDialog>
  );
}
