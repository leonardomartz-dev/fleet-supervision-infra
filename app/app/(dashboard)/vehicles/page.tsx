import { getVehicles } from "@/lib/dashboard";
import { EmptyState, PageHeader, SourceErrors, StatCard } from "@/app/components";
import { VehiclesTable } from "./vehicles-table";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const vehicles = await getVehicles();
  const online = vehicles.data.filter((vehicle) => vehicle.status.toLowerCase() === "online").length;
  const offline = vehicles.data.filter((vehicle) => vehicle.status.toLowerCase() === "offline").length;
  const openAlerts = vehicles.data.filter((vehicle) => {
    const status = vehicle.status.toLowerCase();
    return status.includes("missing") || !vehicle.appVehicleName;
  }).length;

  return (
    <>
      <PageHeader title="Vehicles" />
      <SourceErrors errors={vehicles.errors} />
      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vehicles" value={vehicles.data.length} />
        <StatCard label="Online" value={online} tone={online > 0 ? "good" : "warn"} />
        <StatCard label="Offline" value={offline} tone={offline ? "bad" : "good"} />
        <StatCard label="Open alerts" value={openAlerts} tone={openAlerts ? "warn" : "good"} detail="Device or maintenance flags" />
      </section>
      {vehicles.data.length ? (
        <VehiclesTable rows={vehicles.data} />
      ) : (
        <EmptyState title="No Traccar devices or app vehicle records found. Run npm run seed:demo after the stack is up." />
      )}
    </>
  );
}
