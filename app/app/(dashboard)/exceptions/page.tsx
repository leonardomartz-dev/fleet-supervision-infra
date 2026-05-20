import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DataTable,
  DemoTag,
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  cellClass,
  formatDateTime,
  numberCellClass,
  rowClass,
  strongCellClass,
} from "@/app/components";

type ExceptionWithTrip = Prisma.ExceptionGetPayload<{
  include: {
    trip: { include: { vehicle: true } };
    assignedProperty: true;
  };
}>;

export const dynamic = "force-dynamic";

export default async function ExceptionsPage() {
  let exceptions: ExceptionWithTrip[] = [];
  let error: string | null = null;

  try {
    exceptions = await prisma.exception.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        trip: { include: { vehicle: true } },
        assignedProperty: true,
      },
    });
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <>
      <PageHeader
        title="Exception Queue"
        eyebrow="Manual review candidates"
        subtitle="Show how low-confidence trips would be reviewed, assigned, or excluded once real workflow actions are approved."
      >
        <DemoTag>Controls disabled</DemoTag>
      </PageHeader>
      {error ? (
        <div className="mb-5 rounded-md border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.10)] p-4 text-sm text-[var(--text)]">
          database: {error}
        </div>
      ) : null}
      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Exceptions" value={exceptions.length} tone={exceptions.length ? "warn" : "good"} />
        <StatCard label="Reviewed" value={exceptions.filter((item) => item.reviewed).length} />
        <StatCard label="Open" value={exceptions.filter((item) => !item.reviewed).length} tone="accent" />
        <StatCard label="Real mutations" value="Off" tone="neutral" detail="Demo pass only" />
      </section>
      {exceptions.length ? (
        <DataTable columns={["Vehicle", "Reason", "Trip", "Assigned property", "Notes", "Action"]} minWidth="1080px">
          {exceptions.map((item) => (
            <tr className={rowClass} key={item.id}>
              <td className={strongCellClass}>{item.trip.vehicle.name}</td>
              <td className={cellClass}>
                <StatusBadge value={item.reason} tone="warn" />
              </td>
              <td className={numberCellClass}>
                {formatDateTime(item.trip.startTime)} · {item.trip.distanceMiles.toFixed(2)} mi · {item.trip.durationMinutes} min
              </td>
              <td className={cellClass}>{item.assignedProperty?.name ?? "None yet"}</td>
              <td className={cellClass}>{item.notes ?? "No notes"}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button className="rounded border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]" disabled>
                    Assign
                  </button>
                  <button className="rounded border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]" disabled>
                    Exclude
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="No exception records found. Demo seeding creates one low-confidence example." />
      )}
    </>
  );
}
