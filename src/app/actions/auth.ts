"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";

export interface LoginResult {
  success: boolean;
  error?: string;
}

export async function loginAction(
  prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Por favor, introduce correo electrónico y contraseña." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.active) {
      return { success: false, error: "Credenciales incorrectas o usuario desactivado." };
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, error: "Credenciales incorrectas o usuario desactivado." };
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role as "ADMIN" | "EMPLEADO",
      name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    return { success: true };
  } catch (err) {
    console.error("Error en loginAction:", err);
    return { success: false, error: "Ocurrió un error inesperado al iniciar sesión." };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
