import { NextRequest } from "next/server";

export const runtime = "nodejs";

const KEEP_ALIVE_MS = 15000;

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
