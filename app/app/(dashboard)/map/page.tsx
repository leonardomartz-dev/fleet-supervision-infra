import nextDynamic from "next/dynamic";
import { getMapData } from "@/lib/dashboard";
import { EmptyState, PageHeader, SourceErrors, StatCard } from "@/app/components";

const FleetMap = nextDynamic(() => import("./map-client"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-[560px] place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
      Loading map...
    </div>
  ),
});

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const mapData = await getMapData();

  return (
    <>
      <PageHeader
        title="Live Map"
        subtitle="See vehicle locations and nearby property areas for quick fleet visibility."
      />
      <SourceErrors errors={mapData.errors} />
      <section className="mb-5 grid gap-3 sm:grid-cols-2">
        <StatCard label="Visible vehicles" value={mapData.data.vehicles.length} />
        <StatCard label="Property areas" value={mapData.data.properties.length} />
      </section>
      {mapData.data.vehicles.length || mapData.data.properties.length ? (
        <FleetMap properties={mapData.data.properties} vehicles={mapData.data.vehicles} />
      ) : (
        <EmptyState title="No map data yet. Seed demo vehicles and properties first." />
      )}
    </>
  );
}
