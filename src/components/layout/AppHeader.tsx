"use client";

import { useState, useEffect } from "react";
import { Sparkles, Wifi, WifiOff, QrCode, Clock, Plus } from "lucide-react";
import Link from "next/link";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  whatsappStatus?: "CONNECTED" | "WAITING_QR" | "DISCONNECTED";
  aiEnabled?: boolean;
}

export function AppHeader({
  title = "Panel de Control",
  subtitle = "Gestión integral del taller mecánico y citas de clientes",
  whatsappStatus = "CONNECTED", // Por defecto en mock/seed o conectado
  aiEnabled = true,
}: AppHeaderProps) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid",
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      setCurrentTime(formatter.format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-3 sm:h-16 sm:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">{title}</h1>
        <p className="text-xs text-slate-500 truncate hidden sm:block">{subtitle}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {/* Europe/Madrid Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-600">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="capitalize">{currentTime || "Madrid, ES"}</span>
        </div>

        {/* WhatsApp Connection Status Pill */}
        <div
          title={`Estado de WhatsApp: ${
            whatsappStatus === "CONNECTED"
              ? "Conectado y listo"
              : whatsappStatus === "WAITING_QR"
              ? "Esperando escaneo de código QR"
              : "Desconectado"
          }`}
          className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-3 rounded-lg text-xs font-medium border ${
            whatsappStatus === "CONNECTED"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : whatsappStatus === "WAITING_QR"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {whatsappStatus === "CONNECTED" ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-600" />
          ) : whatsappStatus === "WAITING_QR" ? (
            <QrCode className="h-3.5 w-3.5 text-amber-600" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-red-600" />
          )}
          <span className="hidden sm:inline">
            {whatsappStatus === "CONNECTED"
              ? "WhatsApp Conectado"
              : whatsappStatus === "WAITING_QR"
              ? "Esperando QR"
              : "WhatsApp Offline"}
          </span>
        </div>

        {/* AI Assistant Pill */}
        <div
          title={`Asistente de IA: ${aiEnabled ? "Activo para atender mensajes" : "Pausado"}`}
          className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-3 rounded-lg text-xs font-medium border ${
            aiEnabled
              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          <Sparkles className={`h-3.5 w-3.5 ${aiEnabled ? "text-indigo-600" : "text-slate-400"}`} />
          <span className="hidden sm:inline">{aiEnabled ? "IA Activa" : "IA Pausada"}</span>
        </div>

        {/* Quick New Appointment Button */}
        <Link
          href="/calendario?accion=nueva-cita"
          className="flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 sm:px-3.5"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden min-[420px]:inline">Nueva Cita</span>
        </Link>
      </div>
    </header>
  );
}
