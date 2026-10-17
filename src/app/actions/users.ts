"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createEmployeeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("No autorizado");

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string).toLowerCase().trim();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "EMPLEADO";

  if (!name || !email || !password) {
    return { success: false, error: "Nombre, email y contraseña son obligatorios." };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        active: true,
      },
    });

    revalidatePath("/usuarios");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al crear empleado" };
  }
}

export async function toggleUserActiveAction(userId: string, currentActive: boolean) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("No autorizado");

  if (userId === user.id) {
    return { success: false, error: "No puedes desactivar tu propia cuenta de administrador." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { active: !currentActive },
  });

  revalidatePath("/usuarios");
  return { success: true };
}
