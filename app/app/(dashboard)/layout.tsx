import Link from "next/link";
import { Activity } from "lucide-react";
import { DashboardNav } from "./nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[rgba(13,20,28,0.94)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--accent-blue)]">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-semibold leading-tight text-[var(--text)]">
                Fleet Supervisor
              </span>
            </span>
          </Link>
          <DashboardNav />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
