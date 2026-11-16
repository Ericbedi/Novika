import { NextRequest } from "next/server";
import { getTrackingOrderByToken } from "@/server/data/tracking-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const initialOrder = getTrackingOrderByToken(token);

  if (!initialOrder) {
    return new Response(JSON.stringify({ error: "Lien introuvable" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  // Création du flux Server-Sent Events (SSE) pour mises à jour < 5s (Prompt 05-T)
  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Envoi de l'état initial
      const initialPayload = `data: ${JSON.stringify(initialOrder)}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      // Battement de cœur / vérification périodique toutes les 3 secondes (< 5s)
      const interval = setInterval(() => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }

        const currentOrder = getTrackingOrderByToken(token);
        if (currentOrder) {
          const payload = `data: ${JSON.stringify(currentOrder)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } else {
          // Expiré ou supprimé
          controller.enqueue(encoder.encode(`event: error\ndata: {"error":"expired"}\n\n`));
          clearInterval(interval);
          controller.close();
          isClosed = true;
        }
      }, 3000);

      req.signal.addEventListener("abort", () => {
        isClosed = true;
        clearInterval(interval);
      });
    },
    cancel() {
      isClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
