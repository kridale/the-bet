import { NextResponse } from "next/server";
import { getSpcxSnapshot } from "@/lib/spcx";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const snapshot = await getSpcxSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": snapshot.ok ? "public, s-maxage=30, stale-while-revalidate=30" : "no-store",
    },
  });
}
