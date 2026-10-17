"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createContactAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string).replace(/\D/g, "");
  const email = (formData.get("email") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const stage = (formData.get("stage") as string) || "NUEVO";

  // Vehículo
  const plate = ((formData.get("plate") as string) || "").toUpperCase().trim();
  const brand = (formData.get("brand") as string) || "";
  const model = (formData.get("model") as string) || "";
  const year = formData.get("year") ? parseInt(formData.get("year") as string) : null;
  const kilometers = formData.get("kilometers") ? parseInt(formData.get("kilometers") as string) : null;

  if (!phone) {
    return { success: false, error: "El teléfono es obligatorio" };
  }

  try {
    const contact = await prisma.contact.create({
      data: {
        phone,
        jid: `${phone}@s.whatsapp.net`,
        name: name || undefined,
        email: email || undefined,
        notes: notes || undefined,
        stage,
        vehicles: plate
          ? {
              create: [
                {
                  plate,
                  brand: brand || "Marca",
                  model: model || "Modelo",
                  year,
                  kilometers,
                },
              ],
            }
          : undefined,
      },
    });

    // Crear conversación inicial
    await prisma.conversation.create({
      data: {
        contactId: contact.id,
        status: "ABIERTA",
        aiActive: true,
      },
    });

    revalidatePath("/contactos");
    revalidatePath("/bandeja");
    return { success: true };
  } catch (err: any) {
    console.error("Error al crear contacto:", err);
    return { success: false, error: err.message || "Error al crear contacto" };
  }
}

export async function addVehicleAction(contactId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const plate = ((formData.get("plate") as string) || "").toUpperCase().trim();
  const brand = (formData.get("brand") as string) || "Marca";
  const model = (formData.get("model") as string) || "Modelo";
  const year = formData.get("year") ? parseInt(formData.get("year") as string) : null;
  const kilometers = formData.get("kilometers") ? parseInt(formData.get("kilometers") as string) : null;

  if (!plate) {
    return { success: false, error: "La matrícula es obligatoria" };
  }

  try {
    await prisma.vehicle.create({
      data: {
        contactId,
        plate,
        brand,
        model,
        year,
        kilometers,
      },
    });

    revalidatePath("/contactos");
    revalidatePath("/bandeja");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al registrar vehículo" };
  }
}
