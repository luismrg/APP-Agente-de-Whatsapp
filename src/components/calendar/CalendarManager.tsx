"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Car,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
} from "lucide-react";
import {
  createAppointmentAction,
  updateAppointmentStatusAction,
} from "@/app/actions/appointments";

interface CalendarManagerProps {
  initialAppointments: any[];
  contacts: any[];
  services: any[];
  employees: any[];
  capacity: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDIENTE: { label: "Pendiente", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  CONFIRMADA: { label: "Confirmada", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  EN_TALLER: { label: "En taller", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  LISTO_PARA_RECOGER: { label: "Listo para recoger", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  ENTREGADO: { label: "Entregado", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
  NO_PRESENTADO: { label: "No se presentó", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  CANCELADA: { label: "Cancelada", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export function CalendarManager({
  initialAppointments,
  contacts,
  services,
  employees,
  capacity,
}: CalendarManagerProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [view, setView] = useState<"MES" | "SEMANA" | "DIA">("SEMANA");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Navegación de fechas
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (view === "MES") next.setMonth(next.getMonth() - 1);
    else if (view === "SEMANA") next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (view === "MES") next.setMonth(next.getMonth() + 1);
    else if (view === "SEMANA") next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const res = await createAppointmentAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      setIsModalOpen(false);
      window.location.reload();
    } else {
      setFormError(res.error || "Error al agendar cita");
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
    );
    if (selectedAppointment) {
      setSelectedAppointment({ ...selectedAppointment, status: newStatus });
    }
    await updateAppointmentStatusAction(appointmentId, newStatus);
  };

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  // Días de la semana actual (Lunes a Sábado)
  const getWeekDates = () => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    const week = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const weekDates = getWeekDates();

  return (
    <div className="space-y-4">
      {/* Barra de Controles del Calendario */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs sm:gap-4 sm:p-4 md:flex-row md:items-center md:justify-between">
        {/* Selector de Fecha */}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
          >
            Hoy
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
          <span className="ml-1 truncate text-sm font-bold capitalize text-slate-900 sm:ml-2">
            {currentDate.toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
              ...(view === "DIA" ? { day: "numeric", weekday: "long" } : {}),
            })}
          </span>
        </div>

        {/* Indicador de Elevadores & Vistas */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200/70 text-xs font-medium text-indigo-700">
            <span>Aforo: {capacity} elevadores simultáneos</span>
          </div>

          <div className="flex p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium">
            {(["MES", "SEMANA", "DIA"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1.5 rounded-lg transition capitalize cursor-pointer sm:px-3 ${
                  view === v
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {v.toLowerCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex min-h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* VISTA SEMANAL */}
      {view === "SEMANA" && (
        <>
        <p className="px-1 text-[11px] text-slate-500 sm:hidden">
          Desliza lateralmente para ver todos los días de la semana.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="min-w-[42rem] overflow-hidden">
          <div className="grid grid-cols-6 divide-x divide-slate-200/80 border-b border-slate-200/80 bg-slate-50/70 text-center">
            {weekDates.map((dayDate, i) => {
              const isToday = dayDate.toDateString() === new Date().toDateString();
              return (
                <div key={i} className="p-3">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">
                    {dayDate.toLocaleDateString("es-ES", { weekday: "short" })}
                  </div>
                  <div
                    className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold mt-0.5 ${
                      isToday ? "bg-slate-900 text-white" : "text-slate-800"
                    }`}
                  >
                    {dayDate.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cuadrícula de citas por día */}
          <div className="grid min-h-[500px] grid-cols-6 divide-x divide-slate-100">
            {weekDates.map((dayDate, i) => {
              const dayStr = dayDate.toDateString();
              const dayAppointments = appointments.filter(
                (a) => new Date(a.startTime).toDateString() === dayStr
              );

              return (
                <div key={i} className="p-2 space-y-2 bg-slate-50/20">
                  {dayAppointments.map((app) => {
                    const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDIENTE;
                    const startTimeStr = new Date(app.startTime).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedAppointment(app)}
                        className={`p-2.5 rounded-xl border ${statusConf.border} ${statusConf.bg} shadow-2xs hover:shadow-sm transition cursor-pointer space-y-1.5`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-900">
                            {startTimeStr}
                          </span>
                          {app.source === "IA" && (
                            <span
                              title="Cita agendada por el asistente IA"
                              className="px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold text-[9px] flex items-center gap-0.5"
                            >
                              <Bot className="h-2.5 w-2.5" /> IA
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {app.contact.name || app.contact.phone}
                        </div>

                        {app.vehicle && (
                          <div className="font-mono text-[10px] font-bold text-slate-700">
                            {app.vehicle.plate}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-500 truncate">
                          {app.service?.name}
                        </div>

                        <div className="pt-1">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${statusConf.text} bg-white/70 border ${statusConf.border}`}>
                            {statusConf.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          </div>
        </div>
        </>
      )}

      {/* VISTA DÍA / MES */}
      {view !== "SEMANA" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 text-center shadow-xs sm:p-6">
          <p className="text-xs text-slate-500 mb-4">
            Mostrando listado de citas para {currentDate.toLocaleDateString("es-ES", { dateStyle: "full" })}
          </p>
          <div className="divide-y divide-slate-100 max-w-2xl mx-auto text-left">
            {appointments
              .filter((a) =>
                view === "DIA"
                  ? new Date(a.startTime).toDateString() === currentDate.toDateString()
                  : new Date(a.startTime).getMonth() === currentDate.getMonth()
              )
              .map((app) => {
                const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDIENTE;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppointment(app)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-xl p-3 transition hover:bg-slate-50 sm:p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 bg-slate-100 rounded font-mono font-bold text-xs text-slate-800">
                        {app.vehicle?.plate || "S/M"}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{app.contact.name || app.contact.phone}</span>
                          {app.source === "IA" && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                              IA
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{app.service?.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {new Date(app.startTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConf.bg} ${statusConf.text}`}>
                        {statusConf.label}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Modal Detalle / Cambio de Estado de la Cita */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Detalles de la Cita
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedAppointment.contact.name || selectedAppointment.contact.phone}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha y hora:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(selectedAppointment.startTime).toLocaleString("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehículo:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedAppointment.vehicle?.plate || "Sin matrícula"} (
                    {selectedAppointment.vehicle?.brand} {selectedAppointment.vehicle?.model})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Servicio:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedAppointment.service?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Origen:</span>
                  <span className="font-bold text-indigo-700">
                    {selectedAppointment.source === "IA" ? "🤖 Asistente Virtual IA" : "👤 Manual"}
                  </span>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Notas técnicas:</span>
                  <p className="p-2.5 bg-slate-50 rounded-xl text-slate-600 border border-slate-200/70">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

              {/* Selector de Estado */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Cambiar Estado de la Cita:
                </label>
                <select
                  value={selectedAppointment.status}
                  onChange={(e) => handleStatusChange(selectedAppointment.id, e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  * Si seleccionas «Listo para recoger», el cliente recibirá un WhatsApp automático si la opción está encendida.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Cita Manual con Control de Aforo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Agendar Cita en Taller</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cliente</label>
                <select
                  name="contactId"
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Selecciona cliente...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.phone}
                    </option>
                  ))}
                </select>
              </div>

              {selectedContact && selectedContact.vehicles?.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehículo</label>
                  <select
                    name="vehicleId"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  >
                    {selectedContact.vehicles.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} ({v.brand} {v.model})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Servicio</label>
                <select
                  name="serviceId"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Selecciona servicio...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min - {s.priceFrom ? s.priceFrom + "€" : "A valorar"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha y Hora</label>
                  <input
                    name="startTime"
                    type="datetime-local"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duración (minutos)</label>
                  <input
                    name="durationMinutes"
                    type="number"
                    defaultValue={60}
                    step={15}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mecánico Asignado</label>
                <select
                  name="assignedToUserId"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas / Observaciones</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Observaciones de avería o repuestos..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? "Comprobando elevadores..." : "Confirmar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
