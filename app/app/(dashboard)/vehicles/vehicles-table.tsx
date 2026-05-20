"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { VehicleRow } from "@/lib/dashboard";
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

function alertLabel(vehicle: VehicleRow) {
  const status = vehicle.status.toLowerCase();
  if (status.includes("missing")) return "Device missing";
  if (!vehicle.appVehicleName) return "Profile incomplete";
  return "None";
}

export function VehiclesTable({ rows }: { rows: VehicleRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const statuses = useMemo(() => Array.from(new Set(rows.map((row) => row.status))).sort(), [rows]);
  const filtered = rows.filter((row) => {
    const haystack = [row.name, row.uniqueId, row.appVehicleName, row.status, alertLabel(row), row.lastLocation].join(" ").toLowerCase();
    return (
      haystack.includes(query.toLowerCase()) &&
      (status === "all" || row.status === status)
    );
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 md:flex-row md:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="h-10 w-full rounded border border-[var(--border)] bg-[var(--page-bg)] pl-9 pr-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-blue)]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vehicle, status, alert"
            value={query}
          />
        </label>
        <select
          className="h-10 rounded border border-[var(--border)] bg-[var(--page-bg)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-blue)]"
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          <option value="all">All statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {filtered.length ? (
        <DataTable columns={["Vehicle", "Status", "Open alert", "Last location", "Last seen", "Action"]} minWidth="920px">
          {filtered.map((vehicle) => (
            <tr className={rowClass} key={vehicle.id}>
              <td className={strongCellClass}>{vehicle.name}</td>
              <td className={cellClass}>
                <StatusBadge value={vehicle.status} />
              </td>
              <td className={cellClass}>
                <StatusBadge value={alertLabel(vehicle)} tone={alertLabel(vehicle) === "None" ? "good" : "warn"} />
              </td>
              <td className={cellClass}>{vehicle.lastLocation}</td>
              <td className={numberCellClass}>{formatDateTime(vehicle.lastUpdate)}</td>
              <td className="px-4 py-3">
                <button className="rounded border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]" disabled>
                  View details
                </button>
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="No vehicles match the current filters." />
      )}
    </div>
  );
}
