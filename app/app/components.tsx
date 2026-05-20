import Link from "next/link";
import type { SourceError } from "@/lib/dashboard";

type Tone = "neutral" | "good" | "warn" | "bad" | "accent";

const toneClasses: Record<Tone, string> = {
  neutral: "text-[var(--text)]",
  good: "text-[var(--status-green)]",
  warn: "text-[var(--status-amber)]",
  bad: "text-[var(--status-red)]",
  accent: "text-[var(--accent-blue)]",
};

export function PageHeader({
  title,
  eyebrow,
  subtitle,
  children,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[var(--text)] sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "neutral",
  detail,
}: {
  label: string;
  value: string | number;
  tone?: Tone;
  detail?: string;
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${toneClasses[tone]}`}>{value}</div>
      {detail ? <div className="mt-1 text-xs text-[var(--muted)]">{detail}</div> : null}
    </div>
  );
}

export const MetricCard = StatCard;

export function StatusBadge({ value, tone }: { value: string; tone?: Tone }) {
  const normalized = value.toLowerCase();
  const resolvedTone =
    tone ??
    (normalized.includes("online") || normalized.includes("matched") || normalized.includes("auto")
      ? "good"
      : normalized.includes("offline") || normalized.includes("missing") || normalized.includes("unmatched")
        ? "bad"
        : normalized.includes("low") || normalized.includes("manual") || normalized.includes("review")
          ? "warn"
          : "neutral");

  const dotClass: Record<Tone, string> = {
    neutral: "bg-[var(--status-neutral)]",
    good: "bg-[var(--status-green)]",
    warn: "bg-[var(--status-amber)]",
    bad: "bg-[var(--status-red)]",
    accent: "bg-[var(--accent-blue)]",
  };

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-[var(--text)]">
      <span className={`h-2 w-2 rounded-full ${dotClass[resolvedTone]}`} aria-hidden="true" />
      {formatLabel(value)}
    </span>
  );
}

export const StatusPill = StatusBadge;

export function DataTable({
  columns,
  children,
  minWidth = "900px",
}: {
  columns: string[];
  children: React.ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
          <thead className="sticky top-0 z-10 bg-[var(--surface-raised)] text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            <tr>
              {columns.map((column) => (
                <th className="border-b border-[var(--border)] px-4 py-3 font-semibold" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export const rowClass =
  "bg-[var(--surface)] transition odd:bg-[rgba(255,255,255,0.015)] hover:bg-[rgba(83,177,255,0.08)]";

export const cellClass = "px-4 py-3 text-[var(--text-soft)]";
export const strongCellClass = "px-4 py-3 font-medium text-[var(--text)]";
export const numberCellClass = "px-4 py-3 text-[var(--text-soft)] tabular-nums";

export function DemoTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]">
      {children}
    </span>
  );
}

export function SourceErrors({ errors }: { errors: SourceError[] }) {
  if (!errors.length) return null;

  return (
    <div className="mb-5 rounded-md border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.10)] p-4 text-sm text-[var(--text)]">
      <div className="font-semibold text-[var(--status-amber)]">Demo data warning</div>
      <ul className="mt-2 space-y-1 text-[var(--text-soft)]">
        {errors.map((error, index) => (
          <li key={`${error.source}-${index}`}>
            {error.source}: {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmptyState({
  title,
  actionHref,
}: {
  title: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8 text-center text-[var(--muted)]">
      <p>{title}</p>
      {actionHref ? (
        <Link className="mt-4 inline-flex rounded-md bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-slate-950" href={actionHref}>
          Open related view
        </Link>
      ) : null}
    </div>
  );
}

export function formatDateTime(value: string | Date | null) {
  if (!value) return "Not available";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
