import { LeaseFormLoader } from "@/components/forms/lease-form-loader";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function NewLeasePage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const { unit } = await searchParams;
  return (
    <>
      <PageHeader title="New lease" />
      <LeaseFormLoader defaultUnitId={unit} />
    </>
  );
}
