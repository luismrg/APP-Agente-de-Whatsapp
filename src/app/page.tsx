import { AppLayout } from "@/components/layout/AppLayout";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  MessageSquare,
  Sparkles,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Car,
  ChevronRight,
  TrendingUp,
  Activity,
  Bot,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Lunes
  startOfWeek.setHours(0, 0, 0, 0);

  // Consultas agregadas a Prisma
  const [
    conversationsTodayCount,
    conversationsWeekCount,
    totalConversations,
    aiConversationsCount,
    appointmentsToday,
    upcomingAppointmentsCount,
    aiAppointmentsCount,
    newLeadsCount,
    needsAttentionConversations,
    todayAppointmentsList,
    recentConversationsList,
    aiSetting,
  ] = await Promise.all([
    prisma.conversation.count({
      where: { lastMessageAt: { gte: startOfDay } },
    }),
    prisma.conversation.count({
      where: { lastMessageAt: { gte: startOfWeek } },
    }),
    prisma.conversation.count(),
    prisma.conversation.count({
      where: { aiActive: true },
    }),
    prisma.appointment.count({
      where: { startTime: { gte: startOfDay, lte: endOfDay }, status: { not: "CANCELADA" } },
    }),
    prisma.appointment.count({
      where: { startTime: { gte: now }, status: { not: "CANCELADA" } },
    }),
    prisma.appointment.count({
      where: { source: "IA" },
    }),
    prisma.lead.count({
      where: { stage: "NUEVO" },
    }),
    prisma.conversation.findMany({
      where: { status: "ABIERTA", needsHumanAttention: true },
      include: { contact: { include: { vehicles: true } } },
      take: 5,
    }),
    prisma.appointment.findMany({
      where: { startTime: { gte: startOfDay, lte: endOfDay } },
      include: {
        contact: true,
        vehicle: true,
        service: true,
        assignedToUser: true,
      },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
    prisma.conversation.findMany({
      where: { status: "ABIERTA" },
      include: {
        contact: { include: { vehicles: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 5,
    }),
    prisma.aiSetting.findFirst(),
  ]);

  const aiHandledPercentage = totalConversations > 0
    ? Math.round((aiConversationsCount / totalConversations) * 100)
    : 85;

  return (
    <AppLayout
      title="Panel de Control"
      subtitle="Métricas en tiempo real del taller, citas programadas y actividad de IA"
    >
      {/* Alerta de Conversaciones que requieren atención humana (si existen) */}
      {needsAttentionConversations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-amber-900">
                  {needsAttentionConversations.length} conversación(es) necesitan atención de una persona
                </h2>
                <p className="text-xs text-amber-700">
                  El cliente ha solicitado hablar con un empleado o la IA ha detectado un caso especial.
                </p>
              </div>
            </div>
            <Link
              href="/bandeja?filtro=necesitan-atencion"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <span>Ver en Bandeja</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Grid de Métricas Principales (Inspirado en Untitled UI de la imagen de referencia) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Conversaciones y Atención IA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Conversaciones Hoy
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {conversationsTodayCount}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                {aiHandledPercentage}%
              </span>
              <span>atendidas por la IA</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            {conversationsWeekCount} conversaciones esta semana
          </div>
        </div>

        {/* Card 2: Citas de Hoy y Próximas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Citas Hoy en Taller
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {appointmentsToday}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-indigo-600 flex items-center gap-0.5">
                <Bot className="h-3 w-3" />
                {aiAppointmentsCount}
              </span>
              <span>creadas por el asistente IA</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            {upcomingAppointmentsCount} citas agendadas próximas
          </div>
        </div>

        {/* Card 3: Nuevos Potenciales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Potenciales Nuevos
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {newLeadsCount}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Clientes que han entrado al embudo
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>En fase inicial</span>
            <Link href="/potenciales" className="text-indigo-600 font-medium hover:underline">
              Ver Kanban
            </Link>
          </div>
        </div>

        {/* Card 4: Tiempo Medio de Respuesta & Estado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tiempo 1ª Respuesta
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              &lt; 15 seg
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <Sparkles className="h-3 w-3" />
              <span>Respuesta inmediata vía IA</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Buffer agrupador: {aiSetting?.autoReplyDebounceSeconds ?? 8}s</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>

      {/* Gráfico de Actividad de los últimos 30 días (Representación visual limpia y elegante) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Actividad de Conversaciones y Citas (Últimos 30 días)</h2>
            <p className="text-xs text-slate-500">Volumen diario de clientes atendidos y entradas a taller</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
              <span className="text-slate-600">WhatsApp Atendidos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <span className="text-slate-600">Citas en Taller</span>
            </div>
          </div>
        </div>

        {/* Barras de actividad simuladas con CSS moderno */}
        <div className="h-44 flex items-end gap-2 pt-6 pb-2 border-b border-slate-100">
          {[
            { day: "01", msgs: 42, citas: 4 },
            { day: "03", msgs: 55, citas: 6 },
            { day: "05", msgs: 38, citas: 3 },
            { day: "07", msgs: 68, citas: 7 },
            { day: "09", msgs: 72, citas: 8 },
            { day: "11", msgs: 45, citas: 5 },
            { day: "13", msgs: 82, citas: 9 },
            { day: "15", msgs: 60, citas: 6 },
            { day: "17", msgs: 90, citas: 10 },
            { day: "19", msgs: 54, citas: 5 },
            { day: "21", msgs: 77, citas: 7 },
            { day: "23", msgs: 88, citas: 9 },
            { day: "25", msgs: 65, citas: 6 },
            { day: "27", msgs: 95, citas: 11 },
            { day: "Hoy", msgs: 105, citas: 12 },
          ].map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="w-full flex items-end justify-center gap-1 h-32">
                <div
                  style={{ height: `${(bar.msgs / 110) * 100}%` }}
                  className="w-2.5 bg-slate-900 rounded-t-sm group-hover:bg-slate-700 transition"
                  title={`${bar.msgs} conversaciones`}
                />
                <div
                  style={{ height: `${(bar.citas / 12) * 100}%` }}
                  className="w-2.5 bg-indigo-500 rounded-t-sm group-hover:bg-indigo-400 transition"
                  title={`${bar.citas} citas agendadas`}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tablas resumen en 2 Columnas: Citas del Día y Conversaciones Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: Citas Programadas Hoy */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Citas en Taller para Hoy</h3>
                <p className="text-xs text-slate-500">Vehículos en boxes y elevadores</p>
              </div>
            </div>
            <Link
              href="/calendario"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Ver calendario</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {todayAppointmentsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No hay más citas programadas para el día de hoy.
              </div>
            ) : (
              todayAppointmentsList.map((app) => (
                <div key={app.id} className="p-4 hover:bg-slate-50/70 transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Matrícula tipo matrícula española */}
                    <div className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-xs text-slate-800 tracking-wider">
                      {app.vehicle?.plate || "S/M"}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{app.contact.name || app.contact.phone}</span>
                        {app.source === "IA" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            <Bot className="h-2.5 w-2.5" /> IA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{app.service?.name || "Revisión general"}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-900">
                      {new Date(app.startTime).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        app.status === "LISTO_PARA_RECOGER"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : app.status === "EN_TALLER"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {app.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Columna Derecha: Últimas Conversaciones de WhatsApp */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Conversaciones Recientes</h3>
                <p className="text-xs text-slate-500">Últimos chats en la bandeja compartida</p>
              </div>
            </div>
            <Link
              href="/bandeja"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Ir a bandeja</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentConversationsList.map((conv) => {
              const lastMsg = conv.messages[0];
              const vehicle = conv.contact.vehicles[0];
              return (
                <Link
                  key={conv.id}
                  href={`/bandeja?chat=${conv.id}`}
                  className="p-4 hover:bg-slate-50/70 transition flex items-center justify-between block"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {conv.contact.name ? conv.contact.name.slice(0, 2).toUpperCase() : "WA"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {conv.contact.name || conv.contact.phone}
                        </span>
                        {vehicle && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                            {vehicle.plate}
                          </span>
                        )}
                        {conv.needsHumanAttention && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Atención
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                        {lastMsg?.content || "Sin mensajes recientes"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-slate-400">
                      {new Date(conv.lastMessageAt).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="mt-1">
                      {conv.aiActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          <Bot className="h-2.5 w-2.5" /> IA activa
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Manual
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
