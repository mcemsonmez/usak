import { RouteModal } from "@/components/app/route-modal";
import { PropertyForm } from "@/components/forms/property-form";

export default function NewPropertyModal() {
  return (
    <RouteModal
      title="New property"
      description="A building or a house. Add its units after saving."
    >
      <PropertyForm />
    </RouteModal>
  );
}
