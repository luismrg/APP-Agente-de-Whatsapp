"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getWhatsAppEngine } from "@/lib/whatsapp/singleton";
import { runAiTurn } from "@/lib/ai/runner";

export async function updateAiSettingsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("No autorizado");

  const assistantName = formData.get("assistantName") as string;
  const tone = formData.get("tone") as string;
  const systemPrompt = formData.get("systemPrompt") as string;
  const instructions = formData.get("instructions") as string;
  const workshopKnowledge = formData.get("workshopKnowledge") as string;
  const model = formData.get("model") as string;
  const temperature = parseFloat(formData.get("temperature") as string);
  const autoReplyDebounceSeconds = parseInt(formData.get("autoReplyDebounceSeconds") as string) || 8;
  const readyNotificationEnabled = formData.get("readyNotificationEnabled") === "true";
  const readyNotificationTemplate = formData.get("readyNotificationTemplate") as string;
  const reminderEnabled = formData.get("reminderEnabled") === "true";
  const reminderTemplate = formData.get("reminderTemplate") as string;

  const currentSetting = await prisma.aiSetting.findFirst();

  if (currentSetting) {
    await prisma.aiSetting.update({
      where: { id: currentSetting.id },
      data: {
        assistantName,
        tone,
        systemPrompt,
        instructions,
        workshopKnowledge,
        model,
        temperature,
        autoReplyDebounceSeconds,
        readyNotificationEnabled,
        readyNotificationTemplate,
        reminderEnabled,
        reminderTemplate,
      },
    });
  }

  revalidatePath("/asistente");
  revalidatePath("/");
  return { success: true };
}

export async function toggleGlobalAiAction(enabled: boolean) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("No autorizado");

  const current = await prisma.aiSetting.findFirst();
  if (current) {
    await prisma.aiSetting.update({
      where: { id: current.id },
      data: { enabled },
    });
  }

  revalidatePath("/asistente");
  revalidatePath("/");
  return { success: true, enabled };
}

export async function createOrUpdateServiceAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("No autorizado");

  const serviceId = formData.get("serviceId") as string | null;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const durationMinutes = parseInt(formData.get("durationMinutes") as string) || 60;
  const priceFrom = formData.get("priceFrom")
    ? parseFloat(formData.get("priceFrom") as string)
    : null;
  const requiresEstimate = formData.get("requiresEstimate") === "true";

  if (serviceId) {
    await prisma.service.update({
      where: { id: serviceId },
      data: { name, description, durationMinutes, priceFrom, requiresEstimate },
    });
  } else {
    await prisma.service.create({
      data: { name, description, durationMinutes, priceFrom, requiresEstimate, active: true },
    });
  }

  revalidatePath("/asistente");
  return { success: true };
}

export async function deleteServiceAction(serviceId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("No autorizado");

  await prisma.service.update({
    where: { id: serviceId },
    data: { active: false },
  });

  revalidatePath("/asistente");
  return { success: true };
}

export async function updateBusinessCapacityAction(capacity: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("No autorizado");

  const business = await prisma.business.findFirst();
  if (business) {
    await prisma.business.update({
      where: { id: business.id },
      data: { defaultCapacity: capacity },
    });
  }

  revalidatePath("/asistente");
  revalidatePath("/calendario");
  return { success: true };
}

export async function testAiSimulatorAction(messageText: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  // Buscar o crear conversación sandbox para simulación
  let testContact = await prisma.contact.findFirst({
    where: { phone: "34600000000" },
  });

  if (!testContact) {
    testContact = await prisma.contact.create({
      data: {
        phone: "34600000000",
        name: "Cliente de Prueba (Simulador)",
        stage: "NUEVO",
      },
    });
  }

  let testConversation = await prisma.conversation.findFirst({
    where: { contactId: testContact.id },
  });

  if (!testConversation) {
    testConversation = await prisma.conversation.create({
      data: {
        contactId: testContact.id,
        status: "ABIERTA",
        aiActive: true,
      },
    });
  }

  // Guardar mensaje simulado
  await prisma.message.create({
    data: {
      conversationId: testConversation.id,
      senderType: "CLIENTE",
      content: messageText,
    },
  });

  // Ejecutar turno real de IA con tools
  const result = await runAiTurn(testConversation.id, messageText);

  // Guardar respuesta del asistente
  await prisma.message.create({
    data: {
      conversationId: testConversation.id,
      senderType: "IA",
      content: result.reply,
    },
  });

  return {
    reply: result.reply,
    tools: result.toolCallsExecuted,
  };
}

export async function disconnectWhatsAppAction() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("No autorizado");

  const engine = getWhatsAppEngine();
  await engine.disconnect();
  return { success: true };
}

export async function restartWhatsAppAction() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("No autorizado");

  const engine = getWhatsAppEngine();
  await engine.start(true);
  return { success: true };
}
