import prisma from "@/lib/prisma";
import { aiToolDefinitions, executeAiTool } from "./tools";

export interface AiTurnResult {
  reply: string;
  toolCallsExecuted: string[];
}

export async function runAiTurn(
  conversationId: string,
  userMessageBatch: string
): Promise<AiTurnResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  // 1. Obtener conversación, contacto y contexto
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      contact: {
        include: {
          vehicles: true,
          appointments: {
            where: { status: { not: "CANCELADA" } },
            orderBy: { startTime: "desc" },
            take: 3,
            include: { service: true },
          },
        },
      },
      messages: {
        where: { isInternalNote: false },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!conversation) {
    throw new Error(`Conversación ${conversationId} no encontrada`);
  }

  // 2. Obtener configuración del taller y de la IA
  const [aiSetting, business, services] = await Promise.all([
    prisma.aiSetting.findFirst(),
    prisma.business.findFirst({ include: { schedules: true } }),
    prisma.service.findMany({ where: { active: true } }),
  ]);

  const nowMadrid = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date());

  const servicesList = services
    .map(
      (s) =>
        `- ${s.name}: ${s.description} (Duración aprox: ${s.durationMinutes} min, Precio desde: ${
          s.priceFrom ? s.priceFrom + "€" : "A valorar"
        }, Requiere valoración: ${s.requiresEstimate ? "SÍ" : "NO"})`
    )
    .join("\n");

  const workshopInfo = `${business?.name || "Talleres Digloff"}. Dirección: ${business?.address}. Teléfono: ${business?.phone}. Capacidad: ${business?.defaultCapacity || 2} elevadores.`;

  const contactVehicles = conversation.contact.vehicles
    .map((v) => `${v.brand} ${v.model} (Matrícula: ${v.plate}, ${v.kilometers || "sin"} km)`)
    .join(", ");

  const contactAppointments = conversation.contact.appointments
    .map(
      (a) =>
        `- Cita para ${a.service?.name} el ${a.startTime.toLocaleString("es-ES", {
          timeZone: "Europe/Madrid",
        })} [Estado: ${a.status}]`
    )
    .join("\n");

  const systemPrompt = `
${aiSetting?.systemPrompt || "Eres el Asistente Virtual de Talleres Digloff."}

FECHA Y HORA ACTUAL EN MADRID: ${nowMadrid}
DATOS DEL TALLER: ${workshopInfo}
HORARIO COMERCIAL: Lunes a Jueves de 08:30 a 19:00, Viernes de 08:30 a 18:30. Comida de 13:30 a 15:00. Fines de semana cerrado.
SERVICIOS DEL TALLER:
${servicesList}

DATOS DEL CLIENTE CON EL QUE HABLAS:
- Nombre: ${conversation.contact.name || "Aún no indicado"}
- Teléfono: +${conversation.contact.phone}
- Vehículos registrados: ${contactVehicles || "Ninguno registrado todavía"}
- Citas activas:
${contactAppointments || "Ninguna cita previa"}

INFORMACIÓN Y CONOCIMIENTO ADICIONAL:
${aiSetting?.workshopKnowledge || ""}

INSTRUCCIONES Y REGLAS DE CONDUCTA:
${aiSetting?.instructions || ""}
`;

  // Historial ordenado cronológicamente
  const chatHistory = [...conversation.messages].reverse().map((m) => ({
    role: m.senderType === "CLIENTE" ? "user" : "assistant",
    content: m.content,
  }));

  // Añadimos el nuevo lote de mensajes del usuario si no está ya registrado
  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].content !== userMessageBatch) {
    chatHistory.push({ role: "user", content: userMessageBatch });
  }

  const model = aiSetting?.model || "google/gemini-2.5-flash";
  const temperature = aiSetting?.temperature ?? 0.35;
  const toolCallsExecuted: string[] = [];

  // Si no hay API key de OpenRouter configurada todavía en .env, generamos una respuesta de simulación inteligente
  if (!apiKey || apiKey.trim() === "") {
    return runSimulatedAiResponse(userMessageBatch, conversation, services);
  }

  // Bucle de llamadas a herramientas (máximo 5 iteraciones)
  const messages: any[] = [{ role: "system", content: systemPrompt }, ...chatHistory];

  for (let step = 0; step < 5; step++) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Digloff Workshop OS",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        tools: aiToolDefinitions,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Error devuelto por OpenRouter:", errText);
      // Fallback a respuesta de cortesía si falla la API
      return {
        reply: "Hola, he recibido tu mensaje. En este momento estoy verificando la agenda del taller con el equipo y te confirmamos en breve.",
        toolCallsExecuted,
      };
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    if (!message) {
      break;
    }

    messages.push(message);

    // Si el modelo solicita llamadas a herramientas
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        let functionArgs = {};
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch {}

        toolCallsExecuted.push(functionName);

        const toolResult = await executeAiTool(functionName, functionArgs, {
          contactId: conversation.contactId,
          conversationId: conversation.id,
        });

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: functionName,
          content: toolResult,
        });
      }
    } else {
      // El modelo ha terminado y ofrece su respuesta conversacional final
      return {
        reply: message.content || "Gracias por tu mensaje. ¿En qué más puedo ayudarte?",
        toolCallsExecuted,
      };
    }
  }

  return {
    reply: "He tomado nota de todos los datos en el taller. ¿Necesitas alguna otra consulta para tu vehículo?",
    toolCallsExecuted,
  };
}

// Simulador determinista cuando OPENROUTER_API_KEY no ha sido configurada aún en .env
async function runSimulatedAiResponse(
  userMsg: string,
  conversation: any,
  services: any[]
): Promise<AiTurnResult> {
  const lower = userMsg.toLowerCase();
  const toolCallsExecuted: string[] = [];
  const contactName = conversation.contact.name || "estimado cliente";

  if (lower.includes("urgente") || lower.includes("accidente") || lower.includes("tirado")) {
    await executeAiTool(
      "derivarAPersona",
      { motivo: "Cliente reporta urgencia vial en carretera" },
      { contactId: conversation.contactId, conversationId: conversation.id }
    );
    toolCallsExecuted.push("derivarAPersona");
    return {
      reply: `Hola ${contactName}, lamento lo ocurrido. Al tratarse de una urgencia, te paso de inmediato con el equipo de mecánicos de guardia del taller. Si necesitas grúa urgente o asistencia inmediata, llámanos directamente al +34 912 345 678.`,
      toolCallsExecuted,
    };
  }

  if (lower.includes("precio") || lower.includes("cuanto cuesta") || lower.includes("servicios")) {
    toolCallsExecuted.push("consultarServicios");
    return {
      reply: `¡Hola ${contactName}! Soy el asistente virtual de Talleres Digloff. Te detallo algunos de nuestros servicios más solicitados:\n- Cambio de aceite y filtros: desde 89 €\n- Frenos (pastillas y discos): desde 95 €\n- Neumáticos y equilibrado: desde 65 €\n- Revisión pre-ITV: 49 €\n- Diagnosis electrónica: 45 €\n\n¿Te gustaría reservar cita para alguno de ellos?`,
      toolCallsExecuted,
    };
  }

  if (lower.includes("cita") || lower.includes("hora") || lower.includes("disponibilidad")) {
    toolCallsExecuted.push("consultarDisponibilidad");
    return {
      reply: `¡Hola ${contactName}! Soy el asistente virtual de Talleres Digloff. Tenemos huecos disponibles esta semana de 09:00 a 13:00 y de 15:30 a 18:30 en nuestros dos elevadores. ¿Qué día y hora te viene mejor y para qué vehículo?`,
      toolCallsExecuted,
    };
  }

  return {
    reply: `¡Hola ${contactName}! Soy el asistente virtual de Talleres Digloff. He recibido tu mensaje correctamente. ¿En qué podemos ayudarte hoy con tu vehículo? (Mantenimiento, revisión de frenos, ITV, neumáticos o cita en taller).`,
    toolCallsExecuted,
  };
}
