"use client";

import { FormDialog } from "./form-dialog";
import { MaintenanceRequestForm } from "./maintenance-request-form";

export function ReportIssueButton({ units }: { units: { value: string; label: string }[] }) {
  return (
    <FormDialog
      label="Report an issue"
      title="Report an issue"
      description="Log a problem a tenant reported."
    >
      {(close) => <MaintenanceRequestForm units={units} onSuccess={close} />}
    </FormDialog>
  );
}
