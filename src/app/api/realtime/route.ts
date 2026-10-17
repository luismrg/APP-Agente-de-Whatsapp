import { eventBus } from "@/lib/events/bus";
import { getWhatsAppEngine } from "@/lib/whatsapp/singleton";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Envía el estado inicial de WhatsApp nada más conectar
      const engine = getWhatsAppEngine();
      const initialStatusEvent = `data: ${JSON.stringify({
        type: "whatsapp_status",
        data: {
          status: engine.getStatus(),
          phoneNumber: engine.getPhoneNumber(),
          qr: engine.getQrCode(),
        },
      })}\n\n`;
      controller.enqueue(encoder.encode(initialStatusEvent));

      // 2. Suscribe al bus de eventos
      const onRealtimeEvent = (event: any) => {
        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Si el cliente cerró el socket
        }
      };

      eventBus.on("realtime", onRealtimeEvent);

      // 3. Heartbeat cada 15 segundos para mantener vivo el socket HTTP
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // Limpieza al cerrar
      return () => {
        eventBus.off("realtime", onRealtimeEvent);
        clearInterval(heartbeatInterval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
