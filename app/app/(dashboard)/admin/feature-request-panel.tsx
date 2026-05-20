"use client";

import { SendHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { StatusBadge, formatDateTime } from "@/app/components";

type FeatureRequest = {
  id: number;
  title: string;
  requestedBy: string | null;
  details: string;
  status: string;
  createdAt: Date;
};

export function FeatureRequestPanel({ requests }: { requests: FeatureRequest[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch("/api/feature-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, requestedBy, details }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "The request could not be submitted.");
      return;
    }

    setTitle("");
    setRequestedBy("");
    setDetails("");
    startTransition(() => router.refresh());
  }

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form
        className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]"
        onSubmit={submitRequest}
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-normal text-[var(--text)]">Feature Request Submissions</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            Submitted requests appear in the review queue on this page.
          </p>
        </div>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]" htmlFor="request-title">
          Request
        </label>
        <input
          className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-blue)]"
          id="request-title"
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add mileage exception review"
          required
          value={title}
        />
        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]" htmlFor="requested-by">
          Submitted by
        </label>
        <input
          className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-blue)]"
          id="requested-by"
          maxLength={80}
          onChange={(event) => setRequestedBy(event.target.value)}
          placeholder="Leadership team"
          value={requestedBy}
        />
        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]" htmlFor="request-details">
          Details
        </label>
        <textarea
          className="mt-2 min-h-28 w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm leading-6 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-blue)]"
          id="request-details"
          maxLength={1200}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Describe the decision, report, or workflow leadership wants to add."
          required
          value={details}
        />
        {error ? <p className="mt-3 text-sm text-[var(--status-red)]">{error}</p> : null}
        <button
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          <SendHorizontal className="h-4 w-4" aria-hidden="true" />
          Submit request
        </button>
      </form>

      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-normal text-[var(--text)]">Feature Requests</h2>
          <span className="text-sm tabular-nums text-[var(--muted)]">{requests.length} open</span>
        </div>
        {requests.length ? (
          <div className="space-y-3">
            {requests.map((request) => (
              <article className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-3" key={request.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-medium text-[var(--text)]">{request.title}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {request.requestedBy ?? "Unassigned"} · {formatDateTime(request.createdAt)}
                    </p>
                  </div>
                  <StatusBadge value={request.status} tone="accent" />
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{request.details}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[var(--border-strong)] p-6 text-sm text-[var(--muted)]">
            Submitted leadership requests will appear here.
          </div>
        )}
      </div>
    </section>
  );
}
