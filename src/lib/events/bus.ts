import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var __digloff_event_bus: EventEmitter | undefined;
}

export const eventBus = globalThis.__digloff_event_bus || new EventEmitter();
eventBus.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalThis.__digloff_event_bus = eventBus;
}

export type RealtimeEvent =
  | { type: "whatsapp_status"; data: { status: "DISCONNECTED" | "WAITING_QR" | "CONNECTED"; phoneNumber?: string | null; qr?: string | null } }
  | { type: "new_message"; data: { conversationId: string; message: any } }
  | { type: "conversation_updated"; data: { conversationId: string; patch: any } }
  | { type: "appointment_updated"; data: { appointmentId: string; action: string } }
  | { type: "lead_updated"; data: { leadId: string } };

export function emitRealtimeEvent(event: RealtimeEvent) {
  eventBus.emit("realtime", event);
}
