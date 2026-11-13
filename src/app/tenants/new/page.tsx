import { TenantForm } from "@/components/forms/tenant-form";
import { PageHeader } from "@/components/page-header";

export default function NewTenantPage() {
  return (
    <>
      <PageHeader title="New tenant" />
      <TenantForm />
    </>
  );
}
