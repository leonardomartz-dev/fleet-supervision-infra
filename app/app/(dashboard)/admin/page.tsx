import { CheckCircle2, CircleDashed } from "lucide-react";
import { DataTable, PageHeader, StatusBadge, cellClass, rowClass, strongCellClass } from "@/app/components";
import { prisma } from "@/lib/prisma";
import { FeatureRequestPanel } from "./feature-request-panel";

export const dynamic = "force-dynamic";

const milestones = [
  ["Demo foundation", "Complete", "Traccar, Postgres, Prisma, API checks, and app scaffold are running."],
  ["Public dashboard", "Complete", "A protected demo host serves the Fleet Supervisor dashboard."],
  ["Demo data workflow", "Complete", "Seeded vehicle, properties, trips, allocation record, and report output are available."],
  ["Dashboard cleanup", "Complete", "Vehicles, map, trips, properties, and reports are simplified for review."],
  ["Filtered reports", "Complete", "Reports support property, vehicle, and date-range filtering with filtered CSV export."],
  ["Company repo", "Pending", "Transfer or fork to company-controlled GitHub before pilot."],
  ["Company host", "Pending", "Production hosting ownership must be confirmed before pilot."],
  ["Cloudflare Access", "Pending", "The live host must be protected before real vehicle data is used."],
  ["Backups", "Pending", "Postgres dump and Traccar config export need owner and restore test."],
];

export default async function AdminPage() {
  const featureRequests = await prisma.$queryRaw<
    Array<{
      id: number;
      title: string;
      requestedBy: string | null;
      details: string;
      status: string;
      createdAt: Date;
    }>
  >`
    SELECT "id", "title", "requestedBy", "details", "status"::text, "createdAt"
    FROM feature_requests
    ORDER BY "createdAt" DESC
    LIMIT 20
  `;

  return (
    <>
      <PageHeader title="Admin Milestones" />
      <DataTable columns={["Milestone", "Status", "Notes"]} minWidth="900px">
        {milestones.map(([title, status, body]) => {
          const complete = status === "Complete";
          const Icon = complete ? CheckCircle2 : CircleDashed;
          return (
            <tr className={rowClass} key={title}>
              <td className={strongCellClass}>
                <span className="inline-flex items-center gap-2">
                  <Icon className={complete ? "h-4 w-4 text-[var(--status-green)]" : "h-4 w-4 text-[var(--status-amber)]"} aria-hidden="true" />
                  {title}
                </span>
              </td>
              <td className={cellClass}>
                <StatusBadge value={status} tone={complete ? "good" : "warn"} />
              </td>
              <td className={cellClass}>{body}</td>
            </tr>
          );
        })}
      </DataTable>
      <FeatureRequestPanel requests={featureRequests} />
    </>
  );
}
