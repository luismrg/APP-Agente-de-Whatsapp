"use client";

import { useState, useEffect } from "react";
import {
  QrCode,
  Cpu,
  Smile,
  FileText,
  Wrench,
  Clock,
  BookOpen,
  Power,
  Play,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Wifi,
  WifiOff,
  Bot,
  User,
  Search,
  Key,
} from "lucide-react";
import {
  updateAiSettingsAction,
  toggleGlobalAiAction,
  createOrUpdateServiceAction,
  deleteServiceAction,
  updateBusinessCapacityAction,
  testAiSimulatorAction,
  disconnectWhatsAppAction,
  restartWhatsAppAction,
} from "@/app/actions/ai";

interface AiAssistantSettingsProps {
  initialSetting: any;
  business: any;
  services: any[];
  apiKeyConfigured: boolean;
  aiLogs: any[];
}

export function AiAssistantSettings({
  initialSetting,
  business,
  services,
  apiKeyConfigured,
  aiLogs,
}: AiAssistantSettingsProps) {
  const [activeTab, setActiveTab] = useState<
    | "WHATSAPP"
    | "MODELO"
    | "PERSONALIDAD"
    | "INSTRUCCIONES"
    | "SERVICIOS"
    | "HORARIO"
    | "CONOCIMIENTO"
    | "PROBAR"
    | "LOGS"
  >("WHATSAPP");

  const [setting, setSetting] = useState(initialSetting);
  const [globalEnabled, setGlobalEnabled] = useState(initialSetting?.enabled ?? true);
  const [whatsappStatus, setWhatsappStatus] = useState<"DISCONNECTED" | "WAITING_QR" | "CONNECTED">("DISCONNECTED");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Servicios
  const [editingService, setEditingService] = useState<any | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // Model search
  const [modelSearch, setModelSearch] = useState("");
  const availableModels = [
    { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash (Recomendado - Ultra rápido & Económico)" },
    { id: "google/gemini-flash-1.5", name: "Gemini Flash 1.5 (Estable)" },
    { id: "openai/gpt-4o-mini", name: "OpenAI GPT-4o Mini" },
    { id: "openai/gpt-4o", name: "OpenAI GPT-4o (Avanzado)" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
    { id: "meta-llama/llama-3.3-70b-instruct", name: "Meta Llama 3.3 70B" },
  ];

  // Simulador de chat
  const [simMessages, setSimMessages] = useState<Array<{ role: string; content: string; tools?: string[] }>>([
    {
      role: "assistant",
      content: "¡Hola! Soy el asistente virtual de Talleres Digloff. ¿En qué puedo ayudarte hoy con tu vehículo?",
    },
  ]);
  const [simInput, setSimInput] = useState("");
  const [isSimLoading, setIsSimLoading] = useState(false);

  // Suscripción SSE para refrescar código QR y estado de WhatsApp
  useEffect(() => {
    const eventSource = new EventSource("/api/realtime");

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "whatsapp_status") {
          setWhatsappStatus(payload.data.status);
          if (payload.data.qr) setQrCodeData(payload.data.qr);
          if (payload.data.phoneNumber) setConnectedNumber(payload.data.phoneNumber);
        }
      } catch {}
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleToggleGlobal = async () => {
    const nextState = !globalEnabled;
    setGlobalEnabled(nextState);
    await toggleGlobalAiAction(nextState);
  };

  const handleSaveGeneralSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    await updateAiSettingsAction(formData);
    setIsSaving(false);
    alert("Configuración de IA guardada con éxito");
  };

  const handleSendSimMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInput.trim() || isSimLoading) return;

    const userMsg = simInput.trim();
    setSimInput("");
    setSimMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsSimLoading(true);

    try {
      const res = await testAiSimulatorAction(userMsg);
      setSimMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply, tools: res.tools },
      ]);
    } catch (err: any) {
      setSimMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error al procesar la respuesta: " + err.message },
      ]);
    } finally {
      setIsSimLoading(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createOrUpdateServiceAction(formData);
    setIsServiceModalOpen(false);
    setEditingService(null);
    window.location.reload();
  };

  const handleDeleteService = async (id: string) => {
    if (confirm("¿Seguro que deseas dar de baja este servicio del taller?")) {
      await deleteServiceAction(id);
      window.location.reload();
    }
  };

  const filteredModels = availableModels.filter(
    (m) =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Barra de Interruptor Global de IA */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              globalEnabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
            }`}
          >
            <Power className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Interruptor Maestro del Asistente Virtual
            </h2>
            <p className="text-xs text-slate-500">
              {globalEnabled
                ? "La IA responde autónomamente a los clientes por WhatsApp."
                : "La IA está apagada en todo el taller; los mensajes deben responderse a mano."}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleGlobal}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            globalEnabled
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              : "bg-slate-200 hover:bg-slate-300 text-slate-700"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              globalEnabled ? "bg-white animate-pulse" : "bg-slate-400"
            }`}
          />
          <span>{globalEnabled ? "IA Encendida" : "IA Apagada"}</span>
        </button>
      </div>

      {/* Pestañas de Navegación de Configuración */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
        {[
          { id: "WHATSAPP", label: "Conexión WhatsApp", icon: QrCode },
          { id: "MODELO", label: "Modelo OpenRouter", icon: Cpu },
          { id: "PERSONALIDAD", label: "Personalidad", icon: Smile },
          { id: "INSTRUCCIONES", label: "Instrucciones", icon: FileText },
          { id: "SERVICIOS", label: "Servicios del Taller", icon: Wrench },
          { id: "HORARIO", label: "Horario y Elevadores", icon: Clock },
          { id: "CONOCIMIENTO", label: "Conocimiento (FAQ)", icon: BookOpen },
          { id: "PROBAR", label: "Probar Asistente", icon: Play, isSpecial: true },
          { id: "LOGS", label: "Registro de Auditoría", icon: RefreshCw },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : tab.isSpecial
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* PESTAÑA 1: CONEXIÓN DE WHATSAPP CON CÓDIGO QR            */}
      {/* ========================================================= */}
      {activeTab === "WHATSAPP" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Conexión de WhatsApp con Baileys (Multi-Device)
              </h3>
              <p className="text-xs text-slate-500">
                Escanea el código QR desde la app oficial de WhatsApp en «Dispositivos vinculados».
              </p>
            </div>

            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                whatsappStatus === "CONNECTED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : whatsappStatus === "WAITING_QR"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {whatsappStatus === "CONNECTED" ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Conectado</span>
                </>
              ) : whatsappStatus === "WAITING_QR" ? (
                <>
                  <QrCode className="h-3.5 w-3.5 text-amber-600" />
                  <span>Esperando escaneo QR</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-slate-400" />
                  <span>Desconectado</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Visualizador de QR */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200/80 min-h-[300px]">
              {whatsappStatus === "CONNECTED" ? (
                <div className="text-center space-y-3">
                  <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    WhatsApp Vinculado con Éxito
                  </div>
                  <div className="text-xs font-mono text-slate-600">
                    +{connectedNumber || "Sesión activa en disco"}
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Las credenciales están guardadas en disco y se mantendrán vivas tras los reinicios.
                  </p>
                </div>
              ) : qrCodeData ? (
                <div className="text-center space-y-3">
                  <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200 inline-block">
                    <img
                      src={qrCodeData}
                      alt="Código QR de WhatsApp"
                      className="w-56 h-56 rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-slate-500 animate-pulse">
                    Actualizándose en tiempo real vía SSE...
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-3 text-slate-400">
                  <QrCode className="h-12 w-12 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">
                    Pulsa para iniciar el socket de Baileys
                  </p>
                </div>
              )}
            </div>

            {/* Instrucciones y Botones */}
            <div className="space-y-4">
              <div className="space-y-2 text-xs text-slate-600">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Pasos para conectar:
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>Abre WhatsApp en el teléfono del taller.</li>
                  <li>Ve a <strong>Ajustes &gt; Dispositivos vinculados</strong>.</li>
                  <li>Toca en <strong>Vincular un dispositivo</strong>.</li>
                  <li>Apunta la cámara del móvil a la pantalla para escanear el QR.</li>
                </ol>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => restartWhatsAppAction()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Generar nuevo QR / Reconectar</span>
                </button>

                {whatsappStatus === "CONNECTED" && (
                  <button
                    type="button"
                    onClick={() => disconnectWhatsAppAction()}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition cursor-pointer"
                  >
                    Desconectar WhatsApp
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 2: MODELO OPENROUTER                             */}
      {/* ========================================================= */}
      {activeTab === "MODELO" && (
        <form onSubmit={handleSaveGeneralSettings} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Motor de Inteligencia Artificial (OpenRouter)</h3>
              <p className="text-xs text-slate-500">Selecciona el modelo LLM y ajusta la temperatura de respuesta</p>
            </div>

            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
              apiKeyConfigured ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              <Key className="h-3.5 w-3.5" />
              <span>{apiKeyConfigured ? "API Key Configurada en .env" : "Falta OPENROUTER_API_KEY"}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Modelo Seleccionado
              </label>
              <input
                type="text"
                name="model"
                defaultValue={setting?.model || "google/gemini-2.5-flash"}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none"
              />
            </div>

            {/* Buscador de Modelos Populares */}
            <div>
              <div className="relative mb-2">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="Buscar modelo compatible con llamadas a herramientas..."
                  className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {filteredModels.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      const input = document.querySelector('input[name="model"]') as HTMLInputElement;
                      if (input) input.value = m.id;
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-white text-xs cursor-pointer transition"
                  >
                    <div className="font-bold text-slate-900">{m.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{m.id}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slider de Temperatura */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Temperatura (Creatividad vs Precisión Técnica)</span>
                <span>{setting?.temperature ?? 0.35}</span>
              </div>
              <input
                type="range"
                name="temperature"
                min="0"
                max="1"
                step="0.05"
                defaultValue={setting?.temperature ?? 0.35}
                className="w-full cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.0 (Preciso / Fiel a datos de taller)</span>
                <span>1.0 (Creativo)</span>
              </div>
            </div>

            {/* Debounce Buffer */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Buffer de espera ante ráfagas de mensajes del cliente (segundos)
              </label>
              <input
                type="number"
                name="autoReplyDebounceSeconds"
                defaultValue={setting?.autoReplyDebounceSeconds || 8}
                className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              />
              <span className="text-[11px] text-slate-400 ml-2">Recomendado: 8 segundos</span>
            </div>
          </div>

          {/* Hidden inputs para preservar otros campos */}
          <input type="hidden" name="assistantName" value={setting?.assistantName} />
          <input type="hidden" name="tone" value={setting?.tone} />
          <input type="hidden" name="systemPrompt" value={setting?.systemPrompt} />
          <input type="hidden" name="instructions" value={setting?.instructions} />
          <input type="hidden" name="workshopKnowledge" value={setting?.workshopKnowledge} />
          <input type="hidden" name="readyNotificationEnabled" value={String(setting?.readyNotificationEnabled)} />
          <input type="hidden" name="readyNotificationTemplate" value={setting?.readyNotificationTemplate} />
          <input type="hidden" name="reminderEnabled" value={String(setting?.reminderEnabled)} />
          <input type="hidden" name="reminderTemplate" value={setting?.reminderTemplate} />

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
            >
              {isSaving ? "Guardando..." : "Guardar Configuración de Modelo"}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 3: PERSONALIDAD                                   */}
      {/* ========================================================= */}
      {activeTab === "PERSONALIDAD" && (
        <form onSubmit={handleSaveGeneralSettings} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Identidad y Tono del Asistente</h3>
            <p className="text-slate-500">Define cómo se presenta el asistente ante los clientes del taller.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre del Asistente
              </label>
              <input
                type="text"
                name="assistantName"
                defaultValue={setting?.assistantName || "Digloff Asistente"}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tono Comunicativo
              </label>
              <input
                type="text"
                name="tone"
                defaultValue={setting?.tone || "Profesional, cercano, directo y servicial"}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Prompt del Sistema Principal
            </label>
            <textarea
              name="systemPrompt"
              rows={6}
              defaultValue={setting?.systemPrompt}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Hidden inputs para preservar otros campos */}
          <input type="hidden" name="model" value={setting?.model} />
          <input type="hidden" name="temperature" value={setting?.temperature} />
          <input type="hidden" name="instructions" value={setting?.instructions} />
          <input type="hidden" name="workshopKnowledge" value={setting?.workshopKnowledge} />
          <input type="hidden" name="autoReplyDebounceSeconds" value={setting?.autoReplyDebounceSeconds} />
          <input type="hidden" name="readyNotificationEnabled" value={String(setting?.readyNotificationEnabled)} />
          <input type="hidden" name="readyNotificationTemplate" value={setting?.readyNotificationTemplate} />
          <input type="hidden" name="reminderEnabled" value={String(setting?.reminderEnabled)} />
          <input type="hidden" name="reminderTemplate" value={setting?.reminderTemplate} />

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
              Guardar Personalidad
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 4: INSTRUCCIONES Y REGLAS FIJAS                  */}
      {/* ========================================================= */}
      {activeTab === "INSTRUCCIONES" && (
        <form onSubmit={handleSaveGeneralSettings} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Reglas Fijas de Comportamiento</h3>
            <p className="text-slate-500">
              Instrucciones críticas: derivación a humanos, emergencias y prohibición de diagnósticos absolutos.
            </p>
          </div>

          <textarea
            name="instructions"
            rows={10}
            defaultValue={setting?.instructions}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs leading-relaxed"
          />

          {/* Hidden inputs para preservar otros campos */}
          <input type="hidden" name="assistantName" value={setting?.assistantName} />
          <input type="hidden" name="tone" value={setting?.tone} />
          <input type="hidden" name="systemPrompt" value={setting?.systemPrompt} />
          <input type="hidden" name="workshopKnowledge" value={setting?.workshopKnowledge} />
          <input type="hidden" name="model" value={setting?.model} />
          <input type="hidden" name="temperature" value={setting?.temperature} />
          <input type="hidden" name="autoReplyDebounceSeconds" value={setting?.autoReplyDebounceSeconds} />
          <input type="hidden" name="readyNotificationEnabled" value={String(setting?.readyNotificationEnabled)} />
          <input type="hidden" name="readyNotificationTemplate" value={setting?.readyNotificationTemplate} />
          <input type="hidden" name="reminderEnabled" value={String(setting?.reminderEnabled)} />
          <input type="hidden" name="reminderTemplate" value={setting?.reminderTemplate} />

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
              Guardar Instrucciones
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 5: SERVICIOS DEL TALLER (CRUD)                   */}
      {/* ========================================================= */}
      {activeTab === "SERVICIOS" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Catálogo Oficial de Servicios ({services.length})</h3>
              <p className="text-xs text-slate-500">Servicios que la IA puede cotizar y agendar para clientes.</p>
            </div>
            <button
              onClick={() => {
                setEditingService(null);
                setIsServiceModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Añadir Servicio</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {services.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{s.name}</span>
                    {s.requiresEstimate && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Requiere valoración
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 max-w-xl">{s.description}</p>
                  <div className="text-[11px] text-slate-400 mt-1 flex gap-3">
                    <span>Duración: {s.durationMinutes} min</span>
                    <span>Precio desde: {s.priceFrom ? `${s.priceFrom} €` : "A consultar"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingService(s);
                      setIsServiceModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(s.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 6: HORARIOS Y CAPACIDAD DE ELEVADORES            */}
      {/* ========================================================= */}
      {activeTab === "HORARIO" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Capacidad y Horarios del Taller</h3>
            <p className="text-slate-500">Configuración de elevadores simultáneos y franjas de apertura.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Capacidad Simultánea de Elevadores</div>
              <p className="text-slate-500 text-[11px]">
                Número de vehículos que el taller puede atender al mismo tiempo en boxes.
              </p>
            </div>
            <select
              defaultValue={business?.defaultCapacity || 2}
              onChange={(e) => updateBusinessCapacityAction(parseInt(e.target.value))}
              className="p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} Elevadores
                </option>
              ))}
            </select>
          </div>

          {/* Horario Semanal */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-[11px]">
              Horario de Lunes a Viernes
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl space-y-2">
              <div className="flex justify-between font-medium text-slate-700">
                <span>Lunes a Jueves:</span>
                <span className="font-bold">08:30 - 13:30 / 15:00 - 19:00</span>
              </div>
              <div className="flex justify-between font-medium text-slate-700">
                <span>Viernes:</span>
                <span className="font-bold">08:30 - 13:30 / 15:00 - 18:30</span>
              </div>
              <div className="flex justify-between font-medium text-slate-400">
                <span>Sábados y Domingos:</span>
                <span>Cerrado</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 7: CONOCIMIENTO (FAQ)                            */}
      {/* ========================================================= */}
      {activeTab === "CONOCIMIENTO" && (
        <form onSubmit={handleSaveGeneralSettings} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Base de Conocimiento y Preguntas Frecuentes</h3>
            <p className="text-slate-500">
              Datos específicos del taller: coche de sustitución, garantías, formas de pago y ubicación.
            </p>
          </div>

          <textarea
            name="workshopKnowledge"
            rows={10}
            defaultValue={setting?.workshopKnowledge}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs leading-relaxed"
          />

          {/* Hidden inputs para preservar otros campos */}
          <input type="hidden" name="assistantName" value={setting?.assistantName} />
          <input type="hidden" name="tone" value={setting?.tone} />
          <input type="hidden" name="systemPrompt" value={setting?.systemPrompt} />
          <input type="hidden" name="instructions" value={setting?.instructions} />
          <input type="hidden" name="model" value={setting?.model} />
          <input type="hidden" name="temperature" value={setting?.temperature} />
          <input type="hidden" name="autoReplyDebounceSeconds" value={setting?.autoReplyDebounceSeconds} />
          <input type="hidden" name="readyNotificationEnabled" value={String(setting?.readyNotificationEnabled)} />
          <input type="hidden" name="readyNotificationTemplate" value={setting?.readyNotificationTemplate} />
          <input type="hidden" name="reminderEnabled" value={String(setting?.reminderEnabled)} />
          <input type="hidden" name="reminderTemplate" value={setting?.reminderTemplate} />

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
              Guardar Conocimiento
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 8: PROBAR ASISTENTE (SIMULADOR EN VIVO)          */}
      {/* ========================================================= */}
      {activeTab === "PROBAR" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[600px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900">Simulador de Chat en Vivo</h3>
                <p className="text-[11px] text-slate-500">
                  Prueba la IA con las herramientas y datos actuales sin enviar mensajes por WhatsApp
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setSimMessages([
                  {
                    role: "assistant",
                    content: "¡Hola! Soy el asistente virtual de Talleres Digloff. ¿En qué puedo ayudarte?",
                  },
                ])
              }
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
            >
              Reiniciar chat
            </button>
          </div>

          {/* Hilo del simulador */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
            {simMessages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end ml-auto" : "items-start"
                } max-w-[80%]`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs ${
                    m.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-sm"
                      : "bg-white border border-slate-200/80 text-slate-900 rounded-tl-sm shadow-xs"
                  }`}
                >
                  {m.tools && m.tools.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {m.tools.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-mono font-bold"
                        >
                          🛠️ {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {isSimLoading && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold p-2">
                <div className="h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Ejecutando razonamiento y herramientas de Digloff...</span>
              </div>
            )}
          </div>

          {/* Input simulador */}
          <form onSubmit={handleSendSimMessage} className="p-3 border-t border-slate-100 flex gap-2 bg-white">
            <input
              type="text"
              value={simInput}
              onChange={(e) => setSimInput(e.target.value)}
              placeholder="Escribe como un cliente (Ej: 'Hola, quiero cita para cambio de frenos de mi Golf')..."
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSimLoading || !simInput.trim()}
              className="px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center transition disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 9: LOGS DE AUDITORÍA Y HERRAMIENTAS               */}
      {/* ========================================================= */}
      {activeTab === "LOGS" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Registro de Ejecución de Herramientas de IA</h3>
            <p className="text-xs text-slate-500">Historial de llamadas a herramientas, tiempos y posibles errores.</p>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {aiLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Aún no hay llamadas a herramientas registradas.
              </div>
            ) : (
              aiLogs.map((log) => (
                <div key={log.id} className="py-2.5 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {log.toolName}
                    </span>
                    <span className="text-slate-400 text-[11px] ml-2">
                      {new Date(log.createdAt).toLocaleTimeString("es-ES")}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {log.executionTimeMs} ms
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Alta / Edición de Servicio */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingService ? "Editar Servicio" : "Nuevo Servicio del Taller"}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              {editingService && <input type="hidden" name="serviceId" value={editingService.id} />}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Servicio</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={editingService?.name}
                  required
                  placeholder="Ej: Cambio de pastillas y discos de freno"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingService?.description}
                  required
                  placeholder="Detalle técnico de la intervención..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duración (minutos)</label>
                  <input
                    name="durationMinutes"
                    type="number"
                    defaultValue={editingService?.durationMinutes || 60}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Precio «Desde» (€)</label>
                  <input
                    name="priceFrom"
                    type="number"
                    step="0.01"
                    defaultValue={editingService?.priceFrom || ""}
                    placeholder="89.00"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    name="requiresEstimate"
                    type="checkbox"
                    value="true"
                    defaultChecked={editingService?.requiresEstimate}
                    className="rounded border-slate-300"
                  />
                  <span>Requiere valoración previa (no cotizar precio cerrado)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
