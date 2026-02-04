import { NextRequest, NextResponse } from "next/server";
import { buildSiteOverview, resolveBaseUrl } from "@/lib/aeo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const baseUrl = resolveBaseUrl(request);
  const overview = buildSiteOverview(baseUrl);

  return NextResponse.json({
    ...overview,
    generatedAt: new Date().toISOString(),
  });
}
