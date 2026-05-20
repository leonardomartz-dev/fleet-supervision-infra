import { getProperties } from "@/lib/dashboard";
import {
  DataTable,
  EmptyState,
  PageHeader,
  SourceErrors,
  StatCard,
  cellClass,
  rowClass,
  strongCellClass,
} from "@/app/components";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const properties = await getProperties();
  const mapped = properties.data.filter((property) => property.lat && property.lon).length;

  return (
    <>
      <PageHeader title="Properties" />
      <SourceErrors errors={properties.errors} />
      <section className="mb-5 grid gap-3 sm:grid-cols-2">
        <StatCard label="Properties" value={properties.data.length} />
        <StatCard label="Mapped" value={mapped} tone={mapped === properties.data.length ? "good" : "warn"} />
      </section>
      {properties.data.length ? (
        <DataTable columns={["Property", "Address"]} minWidth="720px">
          {properties.data.map((property) => (
            <tr className={rowClass} key={property.id}>
              <td className={strongCellClass}>{property.name}</td>
              <td className={cellClass}>{property.address}</td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="No properties found. Add property records to begin mapping vehicle activity." />
      )}
    </>
  );
}
