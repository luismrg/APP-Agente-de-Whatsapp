import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import prisma from "@/lib/prisma";
import { emitRealtimeEvent } from "@/lib/events/bus";
import { runAiTurn } from "@/lib/ai/runner";

// Tipado seguro para la instancia global
export interface WhatsAppInstance {
  socket: any | null;
  status: "DISCONNECTED" | "WAITING_QR" | "CONNECTED";
  qrCode: string | null;
  phoneNumber: string | null;
  debounceMap: Map<string, { timer: NodeJS.Timeout; messages: string[] }>;
  isStarting: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __digloff_whatsapp_instance: WhatsAppInstance | undefined;
}

const instance: WhatsAppInstance =
  globalThis.__digloff_whatsapp_instance || {
    socket: null,
    status: "DISCONNECTED",
    qrCode: null,
    phoneNumber: null,
    debounceMap: new Map(),
    isStarting: false,
  };

if (process.env.NODE_ENV !== "production") {
  globalThis.__digloff_whatsapp_instance = instance;
}

export function getWhatsAppEngine() {
  return {
    getStatus: () => instance.status,
    getQrCode: () => instance.qrCode,
    getPhoneNumber: () => instance.phoneNumber,
    start: startWhatsAppSocket,
    disconnect: disconnectWhatsAppSocket,
    sendManualMessage,
  };
}

export async function startWhatsAppSocket(forceReset: boolean = false) {
  if (instance.isStarting || instance.status === "CONNECTED") {
    return;
  }

  instance.isStarting = true;

  try {
    // Dynamic import de Baileys para evitar problemas de SSR
    const {
      makeWASocket,
      useMultiFileAuthState,
      DisconnectReason,
      fetchLatestBaileysVersion,
    } = await import("@whiskeysockets/baileys");
    const pino = (await import("pino")).default;

    const authFolder = path.join(process.cwd(), "storage", "baileys_auth");
    if (forceReset && fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
    }
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({
      version: [2, 3000, 1015901307] as [number, number, number],
    }));

    const logger = pino({ level: "silent" });

    const sock = makeWASocket({
      version,
      logger,
      auth: state,
      printQRInTerminal: false,
      browser: ["Digloff Workshop OS", "Chrome", "1.0.0"],
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
    });

    instance.socket = sock;

    // Actualización de credenciales en disco
    sock.ev.on("creds.update", saveCreds);

    // Ciclo de vida y conexión
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
          instance.qrCode = qrDataUrl;
          instance.status = "WAITING_QR";
          emitRealtimeEvent({
            type: "whatsapp_status",
            data: { status: "WAITING_QR", qr: qrDataUrl },
          });
        } catch (err) {
          console.error("Error al generar imagen de QR:", err);
        }
      }

      if (connection === "open") {
        instance.status = "CONNECTED";
        instance.qrCode = null;
        instance.isStarting = false;

        const rawPhone = sock.user?.id ? sock.user.id.split(":")[0] : null;
        instance.phoneNumber = rawPhone;

        emitRealtimeEvent({
          type: "whatsapp_status",
          data: { status: "CONNECTED", phoneNumber: rawPhone, qr: null },
        });

        console.log(`[Digloff WhatsApp] Conexión abierta con éxito. Número: +${rawPhone}`);
      }

      if (connection === "close") {
        instance.isStarting = false;
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        instance.status = "DISCONNECTED";
        emitRealtimeEvent({
          type: "whatsapp_status",
          data: { status: "DISCONNECTED", phoneNumber: null, qr: null },
        });

        console.log(`[Digloff WhatsApp] Conexión cerrada. Razón código: ${statusCode}. Reconectar: ${shouldReconnect}`);

        if (shouldReconnect) {
          setTimeout(() => {
            startWhatsAppSocket(false);
          }, 5000);
        }
      }
    });

    // Mensajes entrantes
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid;
        if (!remoteJid || remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") {
          continue; // Ignorar grupos y estados de WhatsApp
        }

        const phone = remoteJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");
        const lid = msg.key.participant || (remoteJid.endsWith("@lid") ? remoteJid : null);

        // Extraer texto
        const textContent =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        const isMedia = Boolean(
          msg.message.imageMessage ||
          msg.message.audioMessage ||
          msg.message.videoMessage ||
          msg.message.documentMessage
        );

        // 1. Upsert del Contacto
        const contact = await prisma.contact.upsert({
          where: { phone },
          update: {
            jid: remoteJid,
            lid: lid || undefined,
            name: msg.pushName || undefined,
          },
          create: {
            phone,
            jid: remoteJid,
            lid: lid || undefined,
            name: msg.pushName || `Cliente WhatsApp`,
            stage: "NUEVO",
          },
        });

        // 2. Upsert de la Conversación
        let conversation = await prisma.conversation.findFirst({
          where: { contactId: contact.id },
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              contactId: contact.id,
              status: "ABIERTA",
              aiActive: true,
              unreadCount: 1,
              lastMessageAt: new Date(),
            },
          });
        } else {
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              unreadCount: { increment: 1 },
              lastMessageAt: new Date(),
            },
          });
        }

        // Si es audio o imagen, responder pidiendo texto y marcar revisión humana
        if (isMedia && (!textContent || textContent.trim() === "")) {
          const mediaMsg = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderType: "CLIENTE",
              content: "[Archivo multimedia recibido (Audio/Imagen)]",
              mediaType: msg.message.audioMessage ? "AUDIO" : "IMAGEN",
              whatsappMessageId: msg.key.id,
            },
          });

          emitRealtimeEvent({
            type: "new_message",
            data: { conversationId: conversation.id, message: mediaMsg },
          });

          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { needsHumanAttention: true },
          });

          await sock.sendMessage(remoteJid, {
            text: "Hola, he recibido tu archivo multimedia. Por favor, indícanos brevemente tu consulta por texto para poder atenderte y agendar tu cita en el taller. Nuestro equipo lo revisará en cuanto esté disponible.",
          });
          continue;
        }

        // 3. Guardar mensaje de texto del cliente
        const savedMessage = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderType: "CLIENTE",
            content: textContent,
            mediaType: "TEXTO",
            whatsappMessageId: msg.key.id,
          },
        });

        emitRealtimeEvent({
          type: "new_message",
          data: { conversationId: conversation.id, message: savedMessage },
        });

        // 4. Lógica de Respuesta de IA con Debounce de 8 segundos
        const aiSetting = await prisma.aiSetting.findFirst();
        if (aiSetting?.enabled && conversation.aiActive) {
          enqueueDebouncedAiMessage(remoteJid, conversation.id, textContent, sock);
        }
      }
    });
  } catch (err) {
    console.error("Error al iniciar socket de Baileys:", err);
    instance.status = "DISCONNECTED";
    instance.isStarting = false;
  }
}

export async function disconnectWhatsAppSocket() {
  if (instance.socket) {
    try {
      await instance.socket.logout();
    } catch {}
    instance.socket = null;
    instance.status = "DISCONNECTED";
    instance.phoneNumber = null;
    instance.qrCode = null;

    const authFolder = path.join(process.cwd(), "storage", "baileys_auth");
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
    }

    emitRealtimeEvent({
      type: "whatsapp_status",
      data: { status: "DISCONNECTED", phoneNumber: null, qr: null },
    });
  }
}

// Envío manual desde la web por un empleado del taller
export async function sendManualMessage(
  conversationId: string,
  text: string,
  employeeUserId: string,
  isInternalNote: boolean = false
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { contact: true },
  });

  if (!conversation) {
    throw new Error("Conversación no encontrada");
  }

  // Si es nota interna, solo se persiste en la BD para el equipo
  if (isInternalNote) {
    const noteMessage = await prisma.message.create({
      data: {
        conversationId,
        senderType: "EMPLEADO",
        senderUserId: employeeUserId,
        content: text,
        isInternalNote: true,
        mediaType: "TEXTO",
      },
      include: { senderUser: { select: { id: true, name: true } } },
    });

    emitRealtimeEvent({
      type: "new_message",
      data: { conversationId, message: noteMessage },
    });

    return noteMessage;
  }

  // Si es mensaje de WhatsApp manual enviado por un empleado:
  // REGLA CLAVE: La IA se pausa sola en esa conversación para no interferir
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      aiActive: false,
      lastMessageAt: new Date(),
    },
  });

  emitRealtimeEvent({
    type: "conversation_updated",
    data: { conversationId, patch: { aiActive: false } },
  });

  // Enviar a través del socket de Baileys si está conectado
  const targetJid = conversation.contact.jid || `${conversation.contact.phone}@s.whatsapp.net`;
  if (instance.socket && instance.status === "CONNECTED") {
    try {
      await instance.socket.sendMessage(targetJid, { text });
    } catch (err) {
      console.error("Error al enviar mensaje WhatsApp manual:", err);
    }
  }

  const employeeMessage = await prisma.message.create({
    data: {
      conversationId,
      senderType: "EMPLEADO",
      senderUserId: employeeUserId,
      content: text,
      isInternalNote: false,
      mediaType: "TEXTO",
    },
    include: { senderUser: { select: { id: true, name: true } } },
  });

  emitRealtimeEvent({
    type: "new_message",
    data: { conversationId, message: employeeMessage },
  });

  return employeeMessage;
}

// Buffer de 8 segundos para agrupar ráfagas de mensajes del cliente
function enqueueDebouncedAiMessage(
  jid: string,
  conversationId: string,
  newMessage: string,
  sock: any
) {
  const existing = instance.debounceMap.get(jid);
  if (existing) {
    clearTimeout(existing.timer);
    existing.messages.push(newMessage);
  } else {
    instance.debounceMap.set(jid, {
      timer: setTimeout(() => {}, 0),
      messages: [newMessage],
    });
  }

  const current = instance.debounceMap.get(jid)!;
  current.timer = setTimeout(async () => {
    instance.debounceMap.delete(jid);
    const combinedText = current.messages.join("\n");

    try {
      // Simular "escribiendo..." en WhatsApp
      if (sock) {
        await sock.sendPresenceUpdate("composing", jid).catch(() => {});
      }

      // Procesar con el motor de IA
      const { reply } = await runAiTurn(conversationId, combinedText);

      // Enviar por WhatsApp
      if (sock) {
        await sock.sendMessage(jid, { text: reply });
      }

      // Guardar mensaje en base de datos
      const aiMsg = await prisma.message.create({
        data: {
          conversationId,
          senderType: "IA",
          content: reply,
          mediaType: "TEXTO",
        },
      });

      emitRealtimeEvent({
        type: "new_message",
        data: { conversationId, message: aiMsg },
      });
    } catch (err) {
      console.error("Error en el turno de IA de WhatsApp:", err);
    }
  }, 8000); // 8 segundos exactos requeridos
}
