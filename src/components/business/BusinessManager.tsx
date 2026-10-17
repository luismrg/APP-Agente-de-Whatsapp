"use client";

import { useState } from "react";
import { Building2, MapPin, Phone, Image, CheckCircle2, Clock } from "lucide-react";
import { updateBusinessAction } from "@/app/actions/business";

interface BusinessManagerProps {
  business: any;
}

export function BusinessManager({ business }: BusinessManagerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    const formData = new FormData(e.currentTarget);

    const res = await updateBusinessAction(formData);
    setIsSaving(false);

    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Datos Comerciales del Taller</h2>
          <p className="text-xs text-slate-500">
            Esta información se utiliza en los presupuestos, mensajes de WhatsApp y confirmaciones de citas.
          </p>
        </div>
        {savedSuccess && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Guardado</span>
          </span>
        )}
      </div>

      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
            Nombre del Taller Mecánico
          </label>
          <input
            name="name"
            type="text"
            defaultValue={business?.name || "Talleres Digloff"}
            required
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Teléfono Oficial de Recepción
            </label>
            <div className="relative">
              <Phone className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                name="phone"
                type="text"
                defaultValue={business?.phone || "+34 912 345 678"}
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Elevadores Simultáneos
            </label>
            <input
              name="defaultCapacity"
              type="number"
              min="1"
              max="10"
              defaultValue={business?.defaultCapacity || 2}
              required
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
            Dirección Física del Taller
          </label>
          <div className="relative">
            <MapPin className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              name="address"
              type="text"
              defaultValue={business?.address || "Calle Jacintos de los Santos, 42, Mirador Este, Santo Domingo Este"}
              required
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
            URL del Logotipo (Opcional)
          </label>
          <div className="relative">
            <Image className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              name="logoUrl"
              type="url"
              defaultValue={business?.logoUrl || ""}
              placeholder="https://ejemplo.com/logo.png"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-11 w-full rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 sm:w-auto"
        >
          {isSaving ? "Guardando cambios..." : "Guardar Datos del Negocio"}
        </button>
      </div>
    </form>
  );
}
