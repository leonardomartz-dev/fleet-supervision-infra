import { getTrips } from "@/lib/dashboard";
import { EmptyState, PageHeader, SourceErrors, StatCard } from "@/app/components";
import { TripsTable } from "./trips-table";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const trips = await getTrips();
  const matched = trips.data.filter((trip) => trip.property).length;
  const exceptions = trips.data.filter((trip) => trip.exceptionReason).length;
  const autoRate = trips.data.length ? Math.round((matched / trips.data.length) * 100) : 0;

  return (
    <>
      <PageHeader title="Trip History" />
      <SourceErrors errors={trips.errors} />
      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Trips" value={trips.data.length} />
        <StatCard label="Matched" value={matched} tone={matched > 0 ? "good" : "warn"} />
        <StatCard label="Needs review" value={exceptions} tone={exceptions ? "warn" : "good"} />
        <StatCard label="Auto rate" value={`${autoRate}%`} tone={autoRate >= 80 ? "good" : "warn"} />
      </section>
      {trips.data.length ? (
        <TripsTable rows={trips.data} />
      ) : (
        <EmptyState title="No trips found. Seed demo data to create matched and review examples." />
      )}
    </>
  );
}
