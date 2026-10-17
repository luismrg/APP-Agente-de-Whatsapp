"use client";

import { useState } from "react";
import {
  Plus,
  Car,
  Clock,
  User,
  ArrowRight,
  MoreVertical,
  DollarSign,
  X,
} from "lucide-react";
import { updateLeadStageAction, createLeadAction } from "@/app/actions/leads";

interface KanbanBoardProps {
  initialLeads: any[];
  contacts: any[];
  services: any[];
  employees: any[];
}

const STAGES = [
  { key: "NUEVO", label: "Nuevo", color: "bg-blue-500" },
  { key: "EN_CONVERSACION", label: "En conversación", color: "bg-indigo-500" },
  { key: "PRESUPUESTO_ENVIADO", label: "Presupuesto enviado", color: "bg-amber-500" },
  { key: "CITA_AGENDADA", label: "Cita agendada", color: "bg-purple-500" },
  { key: "GANADO", label: "Ganado", color: "bg-emerald-500" },
  { key: "PERDIDO", label: "Perdido", color: "bg-slate-400" },
];

export function KanbanBoard({
  initialLeads,
  contacts,
  services,
  employees,
}: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState(STAGES[0].key);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDragStart = (leadId: string) => {
    setDraggingLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stageKey: string) => {
    if (!draggingLeadId) return;

    const leadId = draggingLeadId;
    setDraggingLeadId(null);

    // Actualización optimista inmediata
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: stageKey } : l))
    );

    await updateLeadStageAction(leadId, stageKey);
  };

  const handleMoveStage = async (leadId: string, nextStage: string) => {
    setSelectedStage(nextStage);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: nextStage } : l))
    );
    await updateLeadStageAction(leadId, nextStage);
  };

  const handleCreateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const res = await createLeadAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      setIsModalOpen(false);
      window.location.reload();
    } else {
      alert(res.error || "Error al crear potencial");
    }
  };

  return (
    <div className="space-y-4">
      {/* Botón superior de nuevo potencial */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nuevo Potencial</span>
        </button>
      </div>

      {/* Tablero Kanban en Columnas */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {STAGES.map((stage) => {
          const count = leads.filter((lead) => lead.stage === stage.key).length;
          const selected = selectedStage === stage.key;
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => setSelectedStage(stage.key)}
              aria-pressed={selected}
              className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-semibold ${
                selected
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${stage.color}`} />
              {stage.label}
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${selected ? "bg-white/15" : "bg-slate-100"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3.5 overflow-x-auto pb-4 md:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((st) => {
          const stageLeads = leads.filter((l) => l.stage === st.key);
          const totalValue = stageLeads.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);

          return (
            <div
              key={st.key}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(st.key)}
              className={`${selectedStage === st.key ? "flex" : "hidden md:flex"} min-h-72 flex-col rounded-2xl border border-slate-200/60 bg-slate-100/70 p-3 md:min-h-[550px]`}
            >
              {/* Cabecera de Columna */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`h-2 w-2 rounded-full ${st.color}`} />
                  <span className="text-xs font-bold text-slate-800 truncate">{st.label}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-semibold text-[10px]">
                  {stageLeads.length}
                </span>
              </div>

              {/* Total acumulado en euros */}
              {totalValue > 0 && (
                <div className="text-[10px] font-semibold text-slate-500 mb-2 px-1">
                  Total: {totalValue.toLocaleString("es-ES")} €
                </div>
              )}

              {/* Tarjetas Arrastrables */}
              <div className="space-y-2.5 flex-1">
                {stageLeads.map((lead) => {
                  const vehicle = lead.contact?.vehicles?.[0];
                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-grab active:cursor-grabbing space-y-2 select-none"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 line-clamp-2">
                          {lead.title}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600">
                        <div className="font-semibold text-slate-800">
                          {lead.contact?.name || lead.contact?.phone}
                        </div>
                        {vehicle && (
                          <div className="mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-300 font-mono font-bold text-[9px] text-slate-700">
                              {vehicle.plate}
                            </span>
                          </div>
                        )}
                      </div>

                      {lead.estimatedValue && (
                        <div className="text-xs font-bold text-emerald-600">
                          {lead.estimatedValue} €
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{lead.assignedToUser ? lead.assignedToUser.name.split(" ")[0] : "Sin asignar"}</span>
                        
                        {/* Selector rápido de mover etapa */}
                        <select
                          value={lead.stage}
                          onChange={(e) => handleMoveStage(lead.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] text-slate-600 font-medium focus:outline-none"
                        >
                          {STAGES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear Potencial */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Nuevo Potencial de Taller</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título de la oportunidad</label>
                <input
                  name="title"
                  type="text"
                  placeholder="Ej: Cambio de pastillas delanteras y líquido"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cliente</label>
                <select
                  name="contactId"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Selecciona un cliente...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.phone} {c.vehicles[0] ? `(${c.vehicles[0].plate})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Servicio de interés</label>
                  <select
                    name="serviceId"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">Cualquiera...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor estimado (€)</label>
                  <input
                    name="estimatedValue"
                    type="number"
                    step="0.01"
                    placeholder="120"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Etapa inicial</label>
                  <select
                    name="stage"
                    defaultValue="NUEVO"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Responsable</label>
                  <select
                    name="assignedToUserId"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">Sin asignar</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  {isSubmitting ? "Creando..." : "Crear Potencial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
