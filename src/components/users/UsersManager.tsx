"use client";

import { useState } from "react";
import { UserCheck, Shield, Plus, X, UserX, Check } from "lucide-react";
import { createEmployeeAction, toggleUserActiveAction } from "@/app/actions/users";

interface UsersManagerProps {
  initialUsers: any[];
  currentUserId: string;
}

export function UsersManager({ initialUsers, currentUserId }: UsersManagerProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const res = await createEmployeeAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      setIsModalOpen(false);
      window.location.reload();
    } else {
      alert(res.error || "Error al crear usuario");
    }
  };

  const handleToggleActive = async (user: any) => {
    const res = await toggleUserActiveAction(user.id, user.active);
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !user.active } : u))
      );
    } else {
      alert(res.error || "Error al modificar estado");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Equipo de Trabajo ({users.length})</h2>
          <p className="text-xs text-slate-500">
            Administradores y empleados con acceso al panel, calendario y bandeja de WhatsApp
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex min-h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nuevo Empleado</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{u.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.role === "ADMIN"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {u.role === "ADMIN" ? "Administrador" : "Empleado"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                </div>
              </div>

              <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    u.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {u.active ? "Activo" : "Desactivado"}
                </span>

                {u.id !== currentUserId && (
                  <button
                    onClick={() => handleToggleActive(u)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                      u.active
                        ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    {u.active ? "Desactivar" : "Reactivar"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nuevo Empleado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Dar de Alta a Empleado</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre y Apellidos</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Ej: Raúl Benítez (Mecánico)"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  name="email"
                  type="email"
                  placeholder="raul@digloff.com"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contraseña Inicial</label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rol de Acceso</label>
                <select
                  name="role"
                  defaultValue="EMPLEADO"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="EMPLEADO">Empleado (Panel, Bandeja, Contactos, Calendario)</option>
                  <option value="ADMIN">Administrador (Acceso total & Configuración)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? "Creando..." : "Crear Empleado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
