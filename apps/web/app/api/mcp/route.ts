import { NextRequest, NextResponse } from "next/server";
import { buildAeoMatchPayload, fetchDailyDigest, resolveBaseUrl, searchMatches } from "@/lib/aeo";
import { normalizeLang } from "@/i18n";
import { readMatchArticle } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEEP_ALIVE_MS = 15000;
const MCP_PROTOCOL_VERSION = "2024-11-05";

const MCP_TOOLS = [
  {
    name: "goalgazer.search_matches",
    description: "Search match recaps by team, title, or description.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keywords." },
        lang: { type: "string", description: "Language code (en, zh, ja)." },
        limit: { type: "number", description: "Max results (1-25)." },
      },
      required: ["query"],
    },
  },
  {
    name: "goalgazer.get_match",
    description: "Fetch a match recap with structured sections and evidence.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Match slug or ID." },
        lang: { type: "string", description: "Language code (en, zh, ja)." },
      },
      required: ["slug"],
    },
  },
  {
    name: "goalgazer.get_daily_digest",
    description: "Fetch a daily digest for a specific date and league.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date string (YYYY-MM-DD)." },
        lang: { type: "string", description: "Language code (en, zh, ja)." },
        league: { type: "string", description: "League key (e.g., epl, liga)." },
      },
      required: ["date"],
    },
  },
];

function createSseStream(request: NextRequest) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("event: ready\ndata: ok\n\n"));

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, KEEP_ALIVE_MS);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        controller.close();
      });
    },
  });
}

export async function GET(request: NextRequest) {
  const stream = createSseStream(request);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function buildMcpError(id: unknown, message: string, code = -32600) {
  return NextResponse.json({
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message },
  });
}

export async function POST(request: NextRequest) {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return buildMcpError(null, "Invalid JSON payload");
  }

  if (!payload || payload.jsonrpc !== "2.0" || !payload.method) {
    return buildMcpError(payload?.id, "Invalid JSON-RPC request");
  }

  const baseUrl = resolveBaseUrl(request);

  if (payload.method === "initialize") {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: payload.id ?? null,
      result: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        serverInfo: {
          name: "GoalGazer MCP",
          version: "1.0.0",
        },
        capabilities: {
          tools: {},
        },
      },
    });
  }

  if (payload.method === "tools/list") {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: payload.id ?? null,
      result: {
        tools: MCP_TOOLS,
      },
    });
  }

  if (payload.method === "tools/call") {
    const toolName = payload.params?.name as string | undefined;
    const args = payload.params?.arguments ?? {};

    if (!toolName) {
      return buildMcpError(payload.id, "Missing tool name");
    }

    if (toolName === "goalgazer.search_matches") {
      const query = String(args.query ?? "").trim();
      if (!query) {
        return buildMcpError(payload.id, "Missing query for search_matches");
      }
      const lang = normalizeLang(args.lang ?? undefined);
      const limit = typeof args.limit === "number" ? args.limit : undefined;
      const matches = await searchMatches({ query, lang, limit });

      return NextResponse.json({
        jsonrpc: "2.0",
        id: payload.id ?? null,
        result: {
          content: [
            {
              type: "json",
              json: { query, lang, baseUrl, count: matches.length, matches },
            },
          ],
        },
      });
    }

    if (toolName === "goalgazer.get_match") {
      const slug = String(args.slug ?? "").trim();
      if (!slug) {
        return buildMcpError(payload.id, "Missing slug for get_match");
      }
      const lang = normalizeLang(args.lang ?? undefined);
      const { article, resolvedLang, fallback } = await readMatchArticle(slug, lang);

      if (!article) {
        return buildMcpError(payload.id, `Match not found: ${slug}`, -32602);
      }

      const payloadMatch = buildAeoMatchPayload(article, baseUrl, resolvedLang);

      return NextResponse.json({
        jsonrpc: "2.0",
        id: payload.id ?? null,
        result: {
          content: [
            {
              type: "json",
              json: {
                ...payloadMatch,
                baseUrl,
                requestedLang: lang,
                resolvedLang,
                fallback,
              },
            },
          ],
        },
      });
    }

    if (toolName === "goalgazer.get_daily_digest") {
      const date = String(args.date ?? "").trim();
      if (!date) {
        return buildMcpError(payload.id, "Missing date for get_daily_digest");
      }
      const lang = normalizeLang(args.lang ?? undefined);
      const league = args.league ? String(args.league) : undefined;
      const digest = await fetchDailyDigest({ date, lang, league });

      if (!digest) {
        return buildMcpError(payload.id, `Daily digest not found: ${date}`, -32602);
      }

      return NextResponse.json({
        jsonrpc: "2.0",
        id: payload.id ?? null,
        result: {
          content: [
            {
              type: "json",
              json: { ...digest, baseUrl },
            },
          ],
        },
      });
    }

    return buildMcpError(payload.id, `Unknown tool: ${toolName}`, -32601);
  }

  return buildMcpError(payload.id, `Unknown method: ${payload.method}`, -32601);
}
