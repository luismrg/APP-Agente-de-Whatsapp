"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendManualMessage } from "@/lib/whatsapp/singleton";
import { emitRealtimeEvent } from "@/lib/events/bus";
import { revalidatePath } from "next/cache";

export async function sendMessageAction(
  conversationId: string,
  content: string,
  isInternalNote: boolean = false
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  if (!content || content.trim() === "") {
    return { success: false, error: "El mensaje no puede estar vacío" };
  }

  try {
    await sendManualMessage(conversationId, content.trim(), user.id, isInternalNote);
    revalidatePath("/bandeja");
    return { success: true };
  } catch (err: any) {
    console.error("Error al enviar mensaje:", err);
    return { success: false, error: err.message || "Error al enviar mensaje" };
  }
}

export async function toggleConversationAiAction(
  conversationId: string,
  active: boolean
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { aiActive: active },
  });

  emitRealtimeEvent({
    type: "conversation_updated",
    data: { conversationId, patch: { aiActive: active } },
  });

  revalidatePath("/bandeja");
  return { success: true };
}

export async function assignConversationAction(
  conversationId: string,
  assignedToUserId: string | null
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  // Si es empleado, solo puede asignarse a sí mismo
  const targetUserId = user.role === "ADMIN" ? assignedToUserId : user.id;

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { assignedToUserId: targetUserId },
  });

  emitRealtimeEvent({
    type: "conversation_updated",
    data: { conversationId, patch: { assignedToUserId: targetUserId } },
  });

  revalidatePath("/bandeja");
  return { success: true };
}

export async function updateConversationStatusAction(
  conversationId: string,
  status: "ABIERTA" | "RESUELTA"
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status, needsHumanAttention: status === "RESUELTA" ? false : undefined },
  });

  emitRealtimeEvent({
    type: "conversation_updated",
    data: { conversationId, patch: { status } },
  });

  revalidatePath("/bandeja");
  return { success: true };
}

export async function clearHumanAttentionAction(conversationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { needsHumanAttention: false },
  });

  emitRealtimeEvent({
    type: "conversation_updated",
    data: { conversationId, patch: { needsHumanAttention: false } },
  });

  revalidatePath("/bandeja");
  return { success: true };
}
