"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateBusinessAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("No autorizado");

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const logoUrl = (formData.get("logoUrl") as string) || null;
  const defaultCapacity = parseInt(formData.get("defaultCapacity") as string) || 2;

  const currentBusiness = await prisma.business.findFirst();

  if (currentBusiness) {
    await prisma.business.update({
      where: { id: currentBusiness.id },
      data: {
        name,
        phone,
        address,
        logoUrl,
        defaultCapacity,
      },
    });
  }

  revalidatePath("/negocio");
  revalidatePath("/");
  return { success: true };
}
