import { NextRequest, NextResponse } from "next/server";
import { fetchDailyDigest, resolveBaseUrl } from "@/lib/aeo";
import { normalizeLang } from "@/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: { date: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { searchParams } = new URL(request.url);
  const lang = normalizeLang(searchParams.get("lang"));
  const league = searchParams.get("league") ?? "epl";
  const baseUrl = resolveBaseUrl(request);

  const digest = await fetchDailyDigest({
    date: params.date,
    lang,
    league,
  });

  if (!digest) {
    return NextResponse.json(
      { error: "Daily digest not found", date: params.date, league, lang },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ...digest,
    baseUrl,
    generatedAt: new Date().toISOString(),
  });
}
