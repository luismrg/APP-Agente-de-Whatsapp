"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Kanban,
  Calendar,
  Bot,
  UserCheck,
  Building2,
  LogOut,
  Wrench,
  Shield,
  MoreHorizontal,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

interface AppSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "EMPLEADO";
  };
  unreadConversationsCount?: number;
  needsAttentionCount?: number;
}

export function AppSidebar({
  user,
  unreadConversationsCount = 2,
  needsAttentionCount = 1,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainNavigation = [
    { name: "Panel", href: "/", icon: LayoutDashboard },
    {
      name: "Bandeja WhatsApp",
      href: "/bandeja",
      icon: MessageSquare,
      badge: unreadConversationsCount > 0 ? unreadConversationsCount : undefined,
      alertBadge: needsAttentionCount > 0 ? needsAttentionCount : undefined,
    },
    { name: "Contactos & Coches", href: "/contactos", icon: Users },
    { name: "Potenciales", href: "/potenciales", icon: Kanban },
    { name: "Calendario", href: "/calendario", icon: Calendar },
  ];

  const adminNavigation = [
    { name: "Asistente de IA", href: "/asistente", icon: Bot, isSpecial: true },
    { name: "Usuarios", href: "/usuarios", icon: UserCheck },
    { name: "Negocio", href: "/negocio", icon: Building2 },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const mobileNavigation = [
    { name: "Panel", href: "/", icon: LayoutDashboard },
    { name: "Bandeja", href: "/bandeja", icon: MessageSquare },
    { name: "Contactos", href: "/contactos", icon: Users },
    { name: "Potenciales", href: "/potenciales", icon: Kanban },
  ];
  const isMoreActive =
    pathname === "/calendario" ||
    adminNavigation.some((item) => isActive(item.href));

  return (
    <>
    <aside className="sticky top-0 z-20 hidden h-screen w-64 shrink-0 select-none flex-col border-r border-slate-200/80 bg-white md:flex">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-slate-800 transition">
            <Wrench className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 tracking-tight">Digloff</span>
            <span className="block text-[10px] font-medium text-slate-400 tracking-wider uppercase">
              Taller Mecánico
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Gestión
          </div>
          <nav className="space-y-1">
            {mainNavigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${active ? "text-indigo-300" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.alertBadge && (
                      <span
                        title="Conversaciones que necesitan atención humana"
                        className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-amber-500 text-white animate-pulse"
                      >
                        {item.alertBadge}
                      </span>
                    )}
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${
                          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Navigation */}
        {user.role === "ADMIN" && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Administración</span>
              <Shield className="h-3 w-3 text-slate-400" />
            </div>
            <nav className="space-y-1">
              {adminNavigation.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition ${
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${active ? "text-indigo-300" : "text-slate-400"}`} />
                      <span>{item.name}</span>
                    </div>

                    {item.isSpecial && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        IA
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
              <span className="inline-flex items-center text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                {user.role === "ADMIN" ? "Administrador" : "Empleado"}
              </span>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>

    <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur md:hidden">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {mobileNavigation.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition ${
                active ? "text-slate-950" : "text-slate-500"
              }`}
            >
              <span className="relative">
                <Icon className={`h-5 w-5 ${active ? "text-indigo-600" : ""}`} />
                {item.href === "/bandeja" && unreadConversationsCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
                    {unreadConversationsCount}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate">{item.name}</span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-expanded={isMoreOpen}
          aria-controls="mobile-more-menu"
          onClick={() => setIsMoreOpen((open) => !open)}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition ${
            isMoreOpen || isMoreActive ? "text-slate-950" : "text-slate-500"
          }`}
        >
          {isMoreOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <MoreHorizontal className={`h-5 w-5 ${isMoreActive ? "text-indigo-600" : ""}`} />
          )}
          <span>Más</span>
        </button>
      </div>
    </nav>

    {isMoreOpen && (
      <>
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setIsMoreOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/30 md:hidden"
        />
        <div
          id="mobile-more-menu"
          className="fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl md:hidden"
        >
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Más secciones
          </p>
          <nav className="grid grid-cols-2 gap-1">
            {[{ name: "Calendario", href: "/calendario", icon: Calendar }, ...(
              user.role === "ADMIN" ? adminNavigation : []
            )].map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMoreOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-medium ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-indigo-300" : "text-slate-400"}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 px-2 pt-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">{user.name}</p>
              <p className="text-[10px] text-slate-500">
                {user.role === "ADMIN" ? "Administrador" : "Empleado"}
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </>
    )}
    </>
  );
}
