import Link from "next/link";
import { ArrowRight, BarChart3, CarFront, Map } from "lucide-react";
import { getTrips, getVehicles } from "@/lib/dashboard";
import { PageHeader, SourceErrors, StatCard } from "./components";

export const dynamic = "force-dynamic";

const quickLinks = [
  ["Vehicles", "Confirm devices, status, and app-linked records.", "/vehicles", CarFront],
  ["Live map", "Inspect simulated positions and property geofences.", "/map", Map],
  ["Reports", "Download the sample allocation CSV for review.", "/reports", BarChart3],
] as const;

export default async function Home() {
  const [vehicles, trips] = await Promise.all([
    getVehicles(),
    getTrips(),
  ]);
  const errors = [...vehicles.errors, ...trips.errors];
  const matchedTrips = trips.data.filter((trip) => trip.property).length;
  const autoRate = trips.data.length ? Math.round((matchedTrips / trips.data.length) * 100) : 0;
  const needsReview = trips.data.filter(
    (trip) => !trip.property || trip.status === "EXCEPTION" || trip.exceptionReason
  ).length;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-8 text-[var(--text)]">
      <div className="mx-auto max-w-7xl">
        <PageHeader title="Fleet Supervision Demo" />
        <SourceErrors errors={errors} />
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Visible devices" value={vehicles.data.length} tone="good" />
          <StatCard label="Current month trips" value={trips.data.length} />
          <StatCard
            label="Property matched"
            value={`${autoRate}%`}
            tone={autoRate >= 80 ? "good" : "warn"}
          />
          <StatCard label="Needs review" value={needsReview} tone={needsReview ? "warn" : "good"} />
        </section>
        <section className="mt-5 grid gap-3 lg:grid-cols-3">
          {quickLinks.map(([title, body, href, Icon]) => (
            <Link
              className="group rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)]"
              href={href}
              key={href}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="grid h-9 w-9 place-items-center rounded border border-[var(--border)] bg-[var(--page-bg)] text-[var(--accent-blue)]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--accent-blue)]" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{body}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
