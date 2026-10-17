import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "digloff_jwt_secret_key_workshop_2026_super_secure"
);

const COOKIE_NAME = "digloff_session";

// Rutas exclusivas para el Administrador
const ADMIN_ONLY_ROUTES = ["/asistente", "/usuarios", "/negocio"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar archivos estáticos, imágenes y favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/realtime") || // SSE stream maneja su propio handshake
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let sessionPayload: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      sessionPayload = payload;
    } catch {
      // Token inválido o expirado
    }
  }

  // Si está en /login
  if (pathname === "/login") {
    if (sessionPayload) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Rutas protegidas: si no hay sesión, redirigir a /login
  if (!sessionPayload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protección de rutas exclusivas de Administrador
  if (ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    if (sessionPayload.role !== "ADMIN") {
      // Empleado intentando entrar en configuración: redirigir al panel principal
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
