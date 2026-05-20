"use client";

import { Calendar, Download, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import type { ReportRow } from "@/lib/dashboard";
import { reportRowsToCsv } from "@/lib/dashboard";
import {
  DataTable,
  EmptyState,
  cellClass,
  numberCellClass,
  rowClass,
  strongCellClass,
} from "@/app/components";

function parseReportDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatReportDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatRangeLabel(range: DateRange | undefined) {
  if (!range?.from) return "All dates";

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!range.to) return `${formatter.format(range.from)} - Select end`;
  return `${formatter.format(range.from)} - ${formatter.format(range.to)}`;
}

export function ReportsTable({ rows }: { rows: ReportRow[] }) {
  const [query, setQuery] = useState("");
  const [property, setProperty] = useState("all");
  const [vehicle, setVehicle] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement | null>(null);

  const properties = useMemo(() => Array.from(new Set(rows.map((row) => row.property))).sort(), [rows]);
  const vehicles = useMemo(() => Array.from(new Set(rows.map((row) => row.vehicle))).sort(), [rows]);
  const availableDates = useMemo(() => rows.map((row) => parseReportDate(row.date)), [rows]);
  const dateFrom = dateRange?.from ? formatReportDate(dateRange.from) : "";
  const dateTo = dateRange?.to ? formatReportDate(dateRange.to) : dateFrom;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!calendarRef.current?.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const filtered = rows.filter((row) => {
    const haystack = [row.property, row.vehicle, row.date, row.category].join(" ").toLowerCase();
    return (
      haystack.includes(query.toLowerCase()) &&
      (property === "all" || row.property === property) &&
      (vehicle === "all" || row.vehicle === vehicle) &&
      (!dateFrom || row.date >= dateFrom) &&
      (!dateTo || row.date <= dateTo)
    );
  });

  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(reportRowsToCsv(filtered))}`;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 lg:grid-cols-[1fr_repeat(4,auto)]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="h-10 w-full rounded border border-[var(--border)] bg-[var(--page-bg)] pl-9 pr-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-blue)]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search property, vehicle, date"
            value={query}
          />
        </label>
        <select className="h-10 rounded border border-[var(--border)] bg-[var(--page-bg)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-blue)]" onChange={(event) => setProperty(event.target.value)} value={property}>
          <option value="all">All properties</option>
          {properties.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="h-10 rounded border border-[var(--border)] bg-[var(--page-bg)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-blue)]" onChange={(event) => setVehicle(event.target.value)} value={vehicle}>
          <option value="all">All vehicles</option>
          {vehicles.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <div className="relative" ref={calendarRef}>
          <button
            className="inline-flex h-10 min-w-64 items-center justify-between gap-3 rounded border border-[var(--border)] bg-[var(--page-bg)] px-3 text-left text-sm text-[var(--text)] outline-none transition hover:border-[var(--border-strong)] focus:border-[var(--accent-blue)]"
            onClick={() => setCalendarOpen((open) => !open)}
            type="button"
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
              <span className="truncate">{formatRangeLabel(dateRange)}</span>
            </span>
          </button>
          {calendarOpen ? (
            <div className="absolute right-0 z-30 mt-2 w-[min(92vw,360px)] rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-3 shadow-[var(--shadow-soft)]">
              <DayPicker
                defaultMonth={dateRange?.from ?? availableDates[0]}
                mode="range"
                numberOfMonths={1}
                onSelect={setDateRange}
                selected={dateRange}
              />
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                <button
                  className="inline-flex h-9 items-center gap-2 rounded border border-[var(--border)] px-3 text-sm font-medium text-[var(--text-soft)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                  onClick={() => setDateRange(undefined)}
                  type="button"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Clear
                </button>
                <button
                  className="h-9 rounded bg-[var(--accent-blue)] px-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                  onClick={() => setCalendarOpen(false)}
                  type="button"
                >
                  Apply
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <a
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          download="fleet-allocation-report.csv"
          href={csvHref}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download CSV
        </a>
      </div>
      {filtered.length ? (
        <DataTable columns={["Property", "Vehicle", "Date", "Trips", "Miles", "Drive", "On site", "Auto %"]} minWidth="1040px">
          {filtered.map((row) => (
            <tr className={rowClass} key={`${row.property}-${row.vehicle}-${row.date}`}>
              <td className={strongCellClass}>{row.property}</td>
              <td className={cellClass}>{row.vehicle}</td>
              <td className={numberCellClass}>{row.date}</td>
              <td className={numberCellClass}>{row.trips}</td>
              <td className={numberCellClass}>{row.miles.toFixed(2)}</td>
              <td className={numberCellClass}>{row.driveTimeMinutes} min</td>
              <td className={numberCellClass}>{row.timeOnSiteMinutes} min</td>
              <td className={numberCellClass}>{row.autoAllocatedPercent}%</td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="No reports match the current filters." />
      )}
    </div>
  );
}
