import { PropertyForm } from "@/components/forms/property-form";
import { PageHeader } from "@/components/page-header";

export default function NewPropertyPage() {
  return (
    <>
      <PageHeader title="New property" />
      <PropertyForm />
    </>
  );
}
