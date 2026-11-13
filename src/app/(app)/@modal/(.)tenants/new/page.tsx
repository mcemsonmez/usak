import { RouteModal } from "@/components/app/route-modal";
import { TenantForm } from "@/components/forms/tenant-form";

export default function NewTenantModal() {
  return (
    <RouteModal title="New tenant" description="A person or a company renting from you.">
      <TenantForm />
    </RouteModal>
  );
}
