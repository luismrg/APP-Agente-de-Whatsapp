"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Wrench, ShieldCheck, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  const fillCredentials = (email: string, pass: string) => {
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passInput = document.getElementById("password") as HTMLInputElement;
    if (emailInput && passInput) {
      emailInput.value = email;
      passInput.value = pass;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Name */}
        <div className="flex justify-center items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/10">
            <Wrench className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Digloff</h1>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gestión de Taller & Asistente IA</p>
          </div>
        </div>

        <h2 className="mt-6 text-center text-xl font-semibold tracking-tight text-slate-800">
          Iniciar sesión en el taller
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Accede al CRM, calendario, bandeja de WhatsApp y control de IA
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-2.5 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Correo electrónico
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  defaultValue="admin@digloff.com"
                  placeholder="ejemplo@digloff.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Contraseña
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  defaultValue="admin1234"
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Entrando en el sistema...</span>
                </>
              ) : (
                <>
                  <span>Entrar al sistema</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Credentials helper */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Accesos rápidos de prueba</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials("admin@digloff.com", "admin1234")}
                className="p-2.5 text-left rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition"
              >
                <div className="font-semibold text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Admin</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate">admin@digloff.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("marcos@digloff.com", "empleado1234")}
                className="p-2.5 text-left rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition"
              >
                <div className="font-semibold text-slate-900 flex items-center gap-1">
                  <span>Empleado</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate">marcos@digloff.com</div>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Digloff Workshop OS &copy; 2026 &bull; Zona Horaria Europe/Madrid
        </p>
      </div>
    </div>
  );
}
