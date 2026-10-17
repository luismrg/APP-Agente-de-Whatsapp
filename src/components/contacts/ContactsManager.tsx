"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Car,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  ChevronRight,
  X,
  Check,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { createContactAction, addVehicleAction } from "@/app/actions/contacts";

interface ContactsManagerProps {
  initialContacts: any[];
}

export function ContactsManager({ initialContacts }: ContactsManagerProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredContacts = contacts.filter((c) => {
    if (stageFilter !== "TODOS" && c.stage !== stageFilter) return false;

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const nameMatch = c.name?.toLowerCase().includes(q);
      const phoneMatch = c.phone?.includes(q);
      const emailMatch = c.email?.toLowerCase().includes(q);
      const plateMatch = c.vehicles?.some((v: any) => v.plate.toLowerCase().includes(q));
      if (!nameMatch && !phoneMatch && !emailMatch && !plateMatch) return false;
    }

    return true;
  });

  const handleCreateContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const res = await createContactAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      setIsModalOpen(false);
      window.location.reload();
    } else {
      alert(res.error || "Error al crear el contacto");
    }
  };

  const handleAddVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedContact) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const res = await addVehicleAction(selectedContact.id, formData);
    setIsSubmitting(false);

    if (res.success) {
      setIsAddVehicleOpen(false);
      window.location.reload();
    } else {
      alert(res.error || "Error al añadir vehículo");
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, teléfono o matrícula..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="TODOS">Todas las etapas</option>
            <option value="NUEVO">Nuevo</option>
            <option value="EN_CONVERSACION">En conversación</option>
            <option value="PRESUPUESTO_ENVIADO">Presupuesto enviado</option>
            <option value="CITA_AGENDADA">Cita agendada</option>
            <option value="GANADO">Ganado</option>
            <option value="PERDIDO">Perdido</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nuevo Contacto</span>
          </button>
        </div>
      </div>

      {/* Tabla Moderna de Contactos */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Contacto</th>
                <th className="p-4">Vehículos & Matrículas</th>
                <th className="p-4">Etapa</th>
                <th className="p-4">Citas en Taller</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No se han encontrado contactos con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedContact(c)}
                    className="hover:bg-slate-50/70 transition cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {c.name ? c.name.slice(0, 2).toUpperCase() : "WA"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{c.name || "Sin nombre"}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            +{c.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {c.vehicles.length === 0 ? (
                          <span className="text-slate-400 italic">Sin vehículos</span>
                        ) : (
                          c.vehicles.map((v: any) => (
                            <span
                              key={v.id}
                              className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[11px] text-slate-800"
                            >
                              {v.plate} ({v.brand} {v.model})
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {c.stage.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="p-4 text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {c.appointments?.length || 0}
                      </span>{" "}
                      cita(s)
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        href={`/bandeja?chat=${c.conversations?.[0]?.id || ""}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                      >
                        <MessageSquare className="h-3 w-3 text-slate-500" />
                        <span>Chat</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2 md:hidden">
        {filteredContacts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-500">
            No se han encontrado contactos con esos criterios.
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="w-full rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-xs"
            >
              <button
                type="button"
                onClick={() => setSelectedContact(contact)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                    {contact.name ? contact.name.slice(0, 2).toUpperCase() : "WA"}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {contact.name || "Sin nombre"}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">+{contact.phone}</span>
                  </span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
              </button>

              <span className="mt-3 flex flex-wrap items-center gap-1.5">
                {contact.vehicles.length === 0 ? (
                  <span className="text-xs text-slate-400">Sin vehículos</span>
                ) : (
                  contact.vehicles.map((vehicle: any) => (
                    <span
                      key={vehicle.id}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700"
                    >
                      <Car className="h-3 w-3 text-slate-400" />
                      {vehicle.plate}
                    </span>
                  ))
                )}
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700">
                  {contact.stage.replace(/_/g, " ")}
                </span>
              </span>

              <span className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500">
                  {contact.appointments?.length || 0} cita(s) en taller
                </span>
                <Link
                  href={`/bandeja?chat=${contact.conversations?.[0]?.id || ""}`}
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Abrir chat
                </Link>
              </span>
            </div>
          ))
        )}
      </div>

      {/* Modal Ficha Detallada del Contacto */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedContact.name || "Contacto"}</h3>
                <p className="text-xs text-slate-500 font-mono">+{selectedContact.phone}</p>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Vehículos vinculados */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Vehículos del Cliente
                </span>
                <button
                  onClick={() => setIsAddVehicleOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Añadir coche
                </button>
              </div>

              <div className="space-y-2">
                {selectedContact.vehicles?.map((v: any) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {v.brand} {v.model}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Año: {v.year || "S/D"} &bull; Km: {v.kilometers?.toLocaleString("es-ES") || "S/D"}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-slate-800">
                      {v.plate}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Historial de citas */}
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                Historial de Citas
              </span>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedContact.appointments?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No hay citas registradas.</p>
                ) : (
                  selectedContact.appointments?.map((a: any) => (
                    <div key={a.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-800">
                          {new Date(a.startTime).toLocaleDateString("es-ES")} - {a.service?.name || "Servicio"}
                        </div>
                        <div className="text-[10px] text-slate-400">Origen: {a.source}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        {a.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Link
                href={`/bandeja?chat=${selectedContact.conversations?.[0]?.id || ""}`}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Abrir conversación en Bandeja</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Contacto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Nuevo Contacto & Vehículo</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre completo</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Ej: Pedro Martínez"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono (WhatsApp)</label>
                  <input
                    name="phone"
                    type="text"
                    placeholder="Ej: 34612345678"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Correo electrónico</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="pedro@ejemplo.com"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Datos del Vehículo
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Matrícula</label>
                    <input
                      name="plate"
                      type="text"
                      placeholder="1234 ABC"
                      required
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Marca</label>
                    <input
                      name="brand"
                      type="text"
                      placeholder="Seat"
                      required
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Modelo</label>
                    <input
                      name="model"
                      type="text"
                      placeholder="León 1.6 TDI"
                      required
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Kilómetros</label>
                    <input
                      name="kilometers"
                      type="number"
                      placeholder="120000"
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
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
                  {isSubmitting ? "Guardando..." : "Crear Contacto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Añadir Vehículo Adicional */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Añadir Vehículo al Contacto</h3>
            <form onSubmit={handleAddVehicle} className="space-y-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Matrícula</label>
                <input
                  name="plate"
                  type="text"
                  placeholder="5678 XYZ"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">Marca</label>
                  <input
                    name="brand"
                    type="text"
                    placeholder="Renault"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">Modelo</label>
                  <input
                    name="model"
                    type="text"
                    placeholder="Clio"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Añadir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
