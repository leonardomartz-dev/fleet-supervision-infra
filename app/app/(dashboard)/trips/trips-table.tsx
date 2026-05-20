"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { TripRow } from "@/lib/dashboard";
import {
  DataTable,
  EmptyState,
  StatusBadge,
  cellClass,
  formatDateTime,
  numberCellClass,
  rowClass,
  strongCellClass,
} from "@/app/components";

function confidenceTone(score: number | null) {
  if ((score ?? 0) >= 80) return "good" as const;
  if ((score ?? 0) >= 50) return "warn" as const;
  return "bad" as const;
}

export function TripsTable({ rows }: { rows: TripRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [property, setProperty] = useState("all");
  const [vehicle, setVehicle] = useState("all");

  const vehicles = useMemo(() => Array.from(new Set(rows.map((row) => row.vehicle))).sort(), [rows]);
  const properties = useMemo(
    () => Array.from(new Set(rows.map((row) => row.property ?? "Unmatched"))).sort(),
    [rows]
  );
  const statuses = useMemo(
    () => Array.from(new Set(rows.map((row) => row.exceptionReason ?? row.status))).sort(),
    [rows]
  );

  const filtered = rows.filter((row) => {
    const resolvedProperty = row.property ?? "Unmatched";
    const resolvedStatus = row.exceptionReason ?? row.status;
    const haystack = [row.vehicle, resolvedProperty, resolvedStatus].join(" ").toLowerCase();
    return (
      haystack.includes(query.toLowerCase()) &&
      (vehicle === "all" || row.vehicle === vehicle) &&
      (property === "all" || resolvedProperty === property) &&
      (status === "all" || resolvedStatus === status)
    );
  });

  return (
    <div className="space-y-3">
      <div className="grid gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 md:grid-cols-[1fr_repeat(3,auto)]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="h-10 w-full rounded border border-[var(--border)] bg-[var(--page-bg)] pl-9 pr-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-blue)]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vehicle, property, review state"
            value={query}
          />
        </label>
        <select className="h-10 rounded border border-[var(--border)] bg-[var(--page-bg)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-blue)]" onChange={(event) => setVehicle(event.target.value)} value={vehicle}>
          <option value="all">All vehicles</option>
          {vehicles.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="h-10 rounded border border-[var(--border)] bg-[var(--page-bg)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-blue)]" onChange={(event) => setProperty(event.target.value)} value={property}>
          <option value="all">All properties</option>
          {properties.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="h-10 rounded border border-[var(--border)] bg-[var(--page-bg)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-blue)]" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="all">All review states</option>
          {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      {filtered.length ? (
        <DataTable columns={["Vehicle", "Property", "Review", "Start", "Miles", "Duration", "On site", "Confidence"]} minWidth="1020px">
          {filtered.map((trip) => (
            <tr className={rowClass} key={trip.id}>
              <td className={strongCellClass}>{trip.vehicle}</td>
              <td className={cellClass}>{trip.property ?? "Unmatched"}</td>
              <td className={cellClass}><StatusBadge value={trip.exceptionReason ?? trip.status} /></td>
              <td className={numberCellClass}>{formatDateTime(trip.startTime)}</td>
              <td className={numberCellClass}>{trip.distanceMiles.toFixed(2)}</td>
              <td className={numberCellClass}>{trip.durationMinutes} min</td>
              <td className={numberCellClass}>{trip.timeOnSiteMinutes ?? 0} min</td>
              <td className={numberCellClass}>
                <StatusBadge value={`${trip.confidenceScore ?? 0}%`} tone={confidenceTone(trip.confidenceScore)} />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="No trips match the current filters." />
      )}
    </div>
  );
}
