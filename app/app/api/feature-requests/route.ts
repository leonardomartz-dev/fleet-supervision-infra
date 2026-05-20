import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const requestedBy = typeof body?.requestedBy === "string" ? body.requestedBy.trim() : "";
  const details = typeof body?.details === "string" ? body.details.trim() : "";

  if (!title || !details) {
    return NextResponse.json({ error: "Title and details are required." }, { status: 400 });
  }

  const [featureRequest] = await prisma.$queryRaw<
    Array<{
      id: number;
      title: string;
      requestedBy: string | null;
      details: string;
      status: string;
      createdAt: Date;
    }>
  >`
    INSERT INTO feature_requests ("title", "requestedBy", "details")
    VALUES (${title}, ${requestedBy || null}, ${details})
    RETURNING "id", "title", "requestedBy", "details", "status"::text, "createdAt"
  `;

  return NextResponse.json(featureRequest, { status: 201 });
}
