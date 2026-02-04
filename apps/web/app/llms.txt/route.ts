import { NextRequest } from "next/server";
import { buildSiteOverview, getDefaultSiteUrl, resolveBaseUrl } from "@/lib/aeo";
import { readMatchIndex } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const baseUrl = resolveBaseUrl(request);
  const { articles } = await readMatchIndex({ limit: 8 });
  const overview = buildSiteOverview(baseUrl);
  const fallbackBaseUrl = getDefaultSiteUrl();

  const latestLines = articles.map((article) => {
    const slug = article.slug ?? article.matchId;
    const url = `${baseUrl}/en/matches/${slug}`;
    return `- ${article.title} (${article.date}) → ${url}`;
  });

  const body = [
    "# GoalGazer",
    "> Tactical football recaps with structured data, match visuals, and evidence-backed insights.",
    "",
    "## Summary",
    "GoalGazer publishes AI-assisted tactical recaps and daily digests for global football matches. Data is normalized, claims are evidence-backed, and visual assets are provided for analysis.",
    "",
    "## Content Types",
    "- Match recaps (JSON + visuals)",
    "- Daily digests",
    "- League dashboards",
    "",
    "## Machine-accessible endpoints",
    `- ${overview.endpoints.site}`,
    `- ${overview.endpoints.search}`,
    `- ${overview.endpoints.match}`,
    `- ${overview.endpoints.daily}`,
    `- ${overview.endpoints.mcp}`,
    `- ${overview.endpoints.llms}`,
    "",
    "## MCP",
    "GoalGazer exposes an MCP server for tool-based access.",
    `POST ${overview.endpoints.mcp} (JSON-RPC)`,
    `GET ${overview.endpoints.mcp} (SSE keepalive)`,
    "",
    "## Latest matches",
    ...(latestLines.length ? latestLines : ["- No recent matches available."]),
    "",
    "## Contact",
    `- Website: ${fallbackBaseUrl}`,
    "- Email: wuliangtech0118@gmail.com",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
