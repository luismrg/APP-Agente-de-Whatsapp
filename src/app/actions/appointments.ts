"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emitRealtimeEvent } from "@/lib/events/bus";
import { revalidatePath } from "next/cache";
import { getWhatsAppEngine } from "@/lib/whatsapp/singleton";

export async function createAppointmentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const contactId = formData.get("contactId") as string;
  const vehicleId = (formData.get("vehicleId") as string) || null;
  const serviceId = (formData.get("serviceId") as string) || null;
  const startTimeStr = formData.get("startTime") as string;
  const durationMinutes = formData.get("durationMinutes")
    ? parseInt(formData.get("durationMinutes") as string)
    : 60;
  const assignedToUserId = (formData.get("assignedToUserId") as string) || user.id;
  const notes = (formData.get("notes") as string) || null;

  if (!contactId || !startTimeStr) {
    return { success: false, error: "El cliente y la fecha de inicio son obligatorios." };
  }

  const startTime = new Date(startTimeStr);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  // Comprobar aforo simultáneo en elevadores
  const business = await prisma.business.findFirst();
  const maxCapacity = business?.defaultCapacity || 2;

  const overlappingAppointments = await prisma.appointment.count({
    where: {
      status: { not: "CANCELADA" },
      OR: [
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
      ],
    },
  });

  if (overlappingAppointments >= maxCapacity) {
    return {
      success: false,
      error: `Capacidad máxima alcanzada: ya hay ${overlappingAppointments} citas simultáneas en los ${maxCapacity} elevadores del taller para esa franja horaria.`,
    };
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        contactId,
        vehicleId: vehicleId || undefined,
        serviceId: serviceId || undefined,
        startTime,
        endTime,
        status: "PENDIENTE",
        source: "MANUAL",
        assignedToUserId,
        notes,
      },
      include: { contact: true, vehicle: true, service: true },
    });

    // Mover automáticamente el potencial del contacto a CITA_AGENDADA
    await prisma.lead.updateMany({
      where: { contactId },
      data: { stage: "CITA_AGENDADA", lastActivityAt: new Date() },
    });

    emitRealtimeEvent({
      type: "appointment_updated",
      data: { appointmentId: appointment.id, action: "CREATED_MANUAL" },
    });

    revalidatePath("/calendario");
    revalidatePath("/potenciales");
    return { success: true, appointmentId: appointment.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al crear cita" };
  }
}

export async function updateAppointmentStatusAction(
  appointmentId: string,
  newStatus: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { contact: true, vehicle: true, service: true },
  });

  if (!appointment) {
    return { success: false, error: "Cita no encontrada" };
  }

  const updateData: any = { status: newStatus };

  // Automatización: aviso "Listo para recoger" por WhatsApp
  if (newStatus === "LISTO_PARA_RECOGER" && !appointment.readyNotifiedAt) {
    const aiSetting = await prisma.aiSetting.findFirst();
    if (aiSetting?.readyNotificationEnabled) {
      updateData.readyNotifiedAt = new Date();
      const template = aiSetting.readyNotificationTemplate || "Hola {{nombre}}, tu vehículo {{vehiculo}} ya está listo para ser recogido en el taller.";
      const clientName = appointment.contact.name || "Cliente";
      const vehicleDesc = appointment.vehicle ? `${appointment.vehicle.brand} ${appointment.vehicle.model}` : "vehículo";
      const messageText = template
        .replace(/{{nombre}}/g, clientName)
        .replace(/{{vehiculo}}/g, vehicleDesc)
        .replace(/{{matricula}}/g, appointment.vehicle?.plate || "");

      // Enviar WhatsApp al cliente si Baileys está conectado
      const engine = getWhatsAppEngine();
      if (engine.getStatus() === "CONNECTED") {
        const jid = appointment.contact.jid || `${appointment.contact.phone}@s.whatsapp.net`;
        engine.sendManualMessage(
          appointment.contact.conversations?.[0]?.id || "",
          messageText,
          user.id,
          false
        ).catch(() => {});
      }
    }
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: updateData,
  });

  emitRealtimeEvent({
    type: "appointment_updated",
    data: { appointmentId, action: `STATUS_${newStatus}` },
  });

  revalidatePath("/calendario");
  revalidatePath("/");
  return { success: true };
}
