import { RouteModal } from "@/components/app/route-modal";
import { LeaseFormLoader } from "@/components/forms/lease-form-loader";

export const dynamic = "force-dynamic";

export default async function NewLeaseModal({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const { unit } = await searchParams;
  return (
    <RouteModal
      title="New lease"
      description="The variable symbol for payments is created automatically."
      wide
    >
      <LeaseFormLoader defaultUnitId={unit} />
    </RouteModal>
  );
}
