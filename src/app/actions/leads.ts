"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emitRealtimeEvent } from "@/lib/events/bus";
import { revalidatePath } from "next/cache";

export async function updateLeadStageAction(leadId: string, newStage: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      stage: newStage,
      lastActivityAt: new Date(),
    },
  });

  emitRealtimeEvent({
    type: "lead_updated",
    data: { leadId },
  });

  revalidatePath("/potenciales");
  return { success: true };
}

export async function createLeadAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const title = formData.get("title") as string;
  const contactId = formData.get("contactId") as string;
  const serviceId = (formData.get("serviceId") as string) || null;
  const estimatedValue = formData.get("estimatedValue")
    ? parseFloat(formData.get("estimatedValue") as string)
    : null;
  const stage = (formData.get("stage") as string) || "NUEVO";
  const assignedToUserId = (formData.get("assignedToUserId") as string) || null;

  if (!title || !contactId) {
    return { success: false, error: "El título y el contacto son obligatorios" };
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        title,
        contactId,
        serviceId: serviceId || undefined,
        estimatedValue,
        stage,
        assignedToUserId: assignedToUserId || undefined,
      },
    });

    revalidatePath("/potenciales");
    return { success: true, leadId: lead.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al crear potencial" };
  }
}
