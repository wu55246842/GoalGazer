import { NextRequest, NextResponse } from "next/server";
import { resolveBaseUrl, searchMatches } from "@/lib/aeo";
import { normalizeLang } from "@/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const lang = normalizeLang(searchParams.get("lang"));
  const limit = Number(searchParams.get("limit") ?? 10);

  if (!query) {
    return NextResponse.json(
      { error: "Missing required query parameter: q" },
      { status: 400 }
    );
  }

  const baseUrl = resolveBaseUrl(request);
  const matches = await searchMatches({ query, lang, limit });

  return NextResponse.json({
    query,
    lang,
    count: matches.length,
    baseUrl,
    matches,
    generatedAt: new Date().toISOString(),
  });
}
