import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "./prisma";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "digloff_jwt_secret_key_workshop_2026_super_secure"
);

export const COOKIE_NAME = "digloff_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "EMPLEADO";
  name: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EMPLEADO";
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, active: true },
    });

    if (!user || !user.active) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "EMPLEADO",
    };
  } catch (err) {
    console.error("Error al obtener el usuario actual:", err);
    return null;
  }
}
