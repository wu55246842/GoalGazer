import { NextRequest, NextResponse } from "next/server";
import { buildAeoMatchPayload, resolveBaseUrl } from "@/lib/aeo";
import { normalizeLang } from "@/i18n";
import { readMatchArticle } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: { slug: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { searchParams } = new URL(request.url);
  const lang = normalizeLang(searchParams.get("lang"));
  const baseUrl = resolveBaseUrl(request);

  const { article, resolvedLang, fallback } = await readMatchArticle(
    params.slug,
    lang
  );

  if (!article) {
    return NextResponse.json(
      { error: "Match not found", slug: params.slug },
      { status: 404 }
    );
  }

  const payload = buildAeoMatchPayload(article, baseUrl, resolvedLang);

  return NextResponse.json({
    ...payload,
    baseUrl,
    requestedLang: lang,
    resolvedLang,
    fallback,
    generatedAt: new Date().toISOString(),
  });
}
