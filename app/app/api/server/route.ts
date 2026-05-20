import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "fleet-supervision-dashboard",
    environment: process.env.ENVIRONMENT ?? "demo",
    message: "Dashboard server is running. Use / for the UI.",
  });
}

