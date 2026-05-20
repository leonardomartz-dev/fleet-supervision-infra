import { getReportRows } from "@/lib/dashboard";
import {
  EmptyState,
  PageHeader,
  SourceErrors,
  StatCard,
} from "@/app/components";
import { ReportsTable } from "./reports-table";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await getReportRows();
  const totalMiles = reports.data.reduce((sum, row) => sum + row.miles, 0);
  const totalDriveTime = reports.data.reduce((sum, row) => sum + row.driveTimeMinutes, 0);
  const totalTrips = reports.data.reduce((sum, row) => sum + row.trips, 0);

  return (
    <>
      <PageHeader title="Reports" />
      <SourceErrors errors={reports.errors} />
      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Current month trips" value={totalTrips} />
        <StatCard label="Miles" value={totalMiles.toFixed(2)} />
        <StatCard label="Drive time" value={`${totalDriveTime} min`} />
      </section>
      {reports.data.length ? (
        <ReportsTable rows={reports.data} />
      ) : (
        <EmptyState title="No report rows found. Add allocation records to generate a report." />
      )}
    </>
  );
}
