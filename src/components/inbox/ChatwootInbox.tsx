"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Search,
  Bot,
  User,
  Shield,
  Send,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Phone,
  Mail,
  Car,
  Calendar,
  Plus,
  ChevronRight,
  Filter,
  ArrowLeft,
} from "lucide-react";
import {
  sendMessageAction,
  toggleConversationAiAction,
  assignConversationAction,
  updateConversationStatusAction,
  clearHumanAttentionAction,
} from "@/app/actions/inbox";

interface ChatwootInboxProps {
  initialConversations: any[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "EMPLEADO";
  };
  employees: any[];
  selectedChatId?: string;
}

export function ChatwootInbox({
  initialConversations,
  currentUser,
  employees,
  selectedChatId,
}: ChatwootInboxProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeChatId, setActiveChatId] = useState<string>(
    selectedChatId || initialConversations[0]?.id || ""
  );
  const [showingConversationList, setShowingConversationList] = useState(!selectedChatId);
  const [filter, setFilter] = useState<
    "TODAS" | "MIAS" | "SIN_ASIGNAR" | "CON_IA" | "ATENCION" | "RESUELTAS"
  >("TODAS");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conexión en tiempo real con SSE
  useEffect(() => {
    const eventSource = new EventSource("/api/realtime");

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "new_message") {
          const { conversationId, message } = payload.data;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === conversationId) {
                return {
                  ...c,
                  messages: [...c.messages, message],
                  lastMessageAt: new Date().toISOString(),
                };
              }
              return c;
            })
          );
        } else if (payload.type === "conversation_updated") {
          const { conversationId, patch } = payload.data;
          setConversations((prev) =>
            prev.map((c) => (c.id === conversationId ? { ...c, ...patch } : c))
          );
        }
      } catch (err) {
        console.error("Error al procesar SSE en Inbox:", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeChatId);

  // Auto-scroll al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  // Filtros de búsqueda
  const filteredConversations = conversations.filter((c) => {
    // Filtro por estado
    if (filter === "RESUELTAS" && c.status !== "RESUELTA") return false;
    if (filter !== "RESUELTAS" && c.status === "RESUELTA") return false;

    if (filter === "MIAS" && c.assignedToUserId !== currentUser.id) return false;
    if (filter === "SIN_ASIGNAR" && c.assignedToUserId !== null) return false;
    if (filter === "CON_IA" && !c.aiActive) return false;
    if (filter === "ATENCION" && !c.needsHumanAttention) return false;

    // Buscador por nombre, teléfono o matrícula
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const nameMatch = c.contact?.name?.toLowerCase().includes(q);
      const phoneMatch = c.contact?.phone?.includes(q);
      const plateMatch = c.contact?.vehicles?.some((v: any) =>
        v.plate.toLowerCase().includes(q)
      );
      if (!nameMatch && !phoneMatch && !plateMatch) return false;
    }

    return true;
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting || !activeChatId) return;

    setIsSubmitting(true);
    const content = inputText.trim();
    setInputText("");

    try {
      await sendMessageAction(activeChatId, content, isInternalNote);
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAi = async () => {
    if (!activeConversation) return;
    const nextState = !activeConversation.aiActive;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, aiActive: nextState } : c))
    );
    await toggleConversationAiAction(activeChatId, nextState);
  };

  const handleAssignToMe = async () => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, assignedToUserId: currentUser.id, assignedToUser: currentUser }
          : c
      )
    );
    await assignConversationAction(activeChatId, currentUser.id);
  };

  const handleAssignUser = async (userId: string) => {
    const targetUser = employees.find((e) => e.id === userId) || null;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, assignedToUserId: userId || null, assignedToUser: targetUser }
          : c
      )
    );
    await assignConversationAction(activeChatId, userId || null);
  };

  const handleToggleResolved = async () => {
    if (!activeConversation) return;
    const nextStatus = activeConversation.status === "ABIERTA" ? "RESUELTA" : "ABIERTA";
    setConversations((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, status: nextStatus } : c))
    );
    await updateConversationStatusAction(activeChatId, nextStatus);
  };

  const handleClearAttention = async () => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, needsHumanAttention: false } : c))
    );
    await clearHumanAttentionAction(activeChatId);
  };

  const activeVehicle = activeConversation?.contact?.vehicles?.[0];

  return (
    <div className="flex h-[calc(100dvh-14.25rem)] min-h-[24rem] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs md:h-[calc(100vh-8.5rem)]">
      {/* ======================================================== */}
      {/* COLUMNA 1: LISTA DE CONVERSACIONES & FILTROS (340px) */}
      {/* ======================================================== */}
      <div className={`${showingConversationList ? "flex" : "hidden md:flex"} w-full shrink-0 flex-col border-r border-slate-200/80 bg-slate-50/50 md:w-80 lg:w-88`}>
        {/* Cabecera & Buscador */}
        <div className="p-3.5 border-b border-slate-200/70 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Conversaciones ({filteredConversations.length})
            </span>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono o matrícula..."
              className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
            />
          </div>

          {/* Filtros Tipo Píldora */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
            {[
              { id: "TODAS", label: "Todas" },
              { id: "MIAS", label: "Mías" },
              { id: "SIN_ASIGNAR", label: "Sin asignar" },
              { id: "CON_IA", label: "Con IA" },
              { id: "ATENCION", label: "Atención" },
              { id: "RESUELTAS", label: "Resueltas" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                  filter === f.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Chats con Scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No hay conversaciones con este filtro.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeChatId;
              const lastMsg = conv.messages[conv.messages.length - 1];
              const vehicle = conv.contact?.vehicles?.[0];

              return (
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveChatId(conv.id);
                      setShowingConversationList(false);
                    }
                  }}
                  onClick={() => {
                    setActiveChatId(conv.id);
                    setShowingConversationList(false);
                  }}
                  className={`w-full p-3.5 text-left transition cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                    isSelected
                      ? "bg-white border-l-4 border-l-slate-900 shadow-xs"
                      : "hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {conv.contact?.name ? conv.contact.name.slice(0, 2).toUpperCase() : "WA"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {conv.contact?.name || conv.contact?.phone}
                          </span>
                        </div>
                        {vehicle && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-300 font-mono font-bold text-[10px] text-slate-800">
                            {vehicle.plate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400">
                        {new Date(conv.lastMessageAt).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 truncate mt-1.5 pl-10.5">
                    {lastMsg?.content || "Sin mensajes"}
                  </p>

                  <div className="flex items-center justify-between mt-2 pl-10.5 text-[10px]">
                    <div className="flex items-center gap-1">
                      {conv.aiActive ? (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium flex items-center gap-0.5">
                          <Bot className="h-2.5 w-2.5" /> IA
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          Manual
                        </span>
                      )}
                      {conv.needsHumanAttention && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold animate-pulse">
                          Atención
                        </span>
                      )}
                    </div>

                    <span className="text-slate-400 truncate max-w-[100px]">
                      {conv.assignedToUser ? conv.assignedToUser.name.split(" ")[0] : "Sin asignar"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* COLUMNA 2: CHAT ACTIVO CON NOTAS Y BURBUJAS (FLEX-1)   */}
      {/* ======================================================== */}
      {activeConversation ? (
        <div className={`${showingConversationList ? "hidden md:flex" : "flex"} min-w-0 flex-1 flex-col bg-white`}>
          {/* Cabecera del Chat */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-white p-2.5 sm:gap-3 sm:p-3.5">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowingConversationList(true)}
                aria-label="Volver a las conversaciones"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                {activeConversation.contact?.name
                  ? activeConversation.contact.name.slice(0, 2).toUpperCase()
                  : "WA"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-slate-900 truncate">
                    {activeConversation.contact?.name || activeConversation.contact?.phone}
                  </h2>
                  {activeVehicle && (
                    <span className="hidden rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-800 sm:inline">
                      {activeVehicle.plate} - {activeVehicle.brand} {activeVehicle.model}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  +{activeConversation.contact?.phone}
                </div>
              </div>
            </div>

            {/* Acciones de Cabecera: Toggle IA, Asignación, Resolver */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {/* Alerta de Atención Humana */}
              {activeConversation.needsHumanAttention && (
                <button
                  onClick={handleClearAttention}
                  className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-semibold flex items-center gap-1 transition"
                  title="Marcar aviso de atención como resuelto"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Resolver alerta</span>
                </button>
              )}

              {/* Interruptor de IA por Conversación */}
              <button
                onClick={handleToggleAi}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition cursor-pointer sm:px-2.5 ${
                  activeConversation.aiActive
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
                title={
                  activeConversation.aiActive
                    ? "IA activa en este chat. Pulsa para pausar."
                    : "IA pausada. Pulsa para reactivar."
                }
              >
                <Bot className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{activeConversation.aiActive ? "IA Activa" : "IA Pausada"}</span>
              </button>

              {/* Asignación */}
              {currentUser.role === "ADMIN" ? (
                <select
                  value={activeConversation.assignedToUserId || ""}
                  onChange={(e) => handleAssignUser(e.target.value)}
                  className="max-w-20 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1 text-xs font-medium text-slate-700 focus:outline-none sm:max-w-none sm:px-2"
                >
                  <option value="">Sin asignar</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={handleAssignToMe}
                  disabled={activeConversation.assignedToUserId === currentUser.id}
                  className="max-w-20 truncate rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 cursor-pointer sm:max-w-none sm:px-2"
                >
                  {activeConversation.assignedToUserId === currentUser.id
                    ? "Asignada a mí"
                    : "Asignarme"}
                </button>
              )}

              {/* Botón Resolver / Reabrir */}
              <button
                onClick={handleToggleResolved}
                className={`p-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                  activeConversation.status === "RESUELTA"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
                title={
                  activeConversation.status === "RESUELTA"
                    ? "Conversación resuelta. Pulsa para reabrir."
                    : "Marcar como resuelta."
                }
              >
                {activeConversation.status === "RESUELTA" ? (
                  <RotateCcw className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Hilo de Mensajes con Burbujas Diferenciadas */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {activeConversation.messages.map((m: any) => {
              if (m.isInternalNote) {
                // NOTA INTERNA (Visible solo para el equipo del taller)
                return (
                  <div
                    key={m.id}
                    className="p-3 mx-4 my-2 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-900 shadow-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-amber-800 mb-1">
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-amber-600" />
                        <span>Nota interna de equipo ({m.senderUser?.name || "Asistente"})</span>
                      </div>
                      <span className="text-[10px] text-amber-600">
                        {new Date(m.createdAt).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                );
              }

              if (m.senderType === "CLIENTE") {
                // MENSAJE DEL CLIENTE (Alineado a la izquierda, blanco con borde)
                return (
                  <div key={m.id} className="flex flex-col items-start max-w-[75%]">
                    <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs text-slate-900 shadow-xs">
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 pl-1">
                      {new Date(m.createdAt).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              }

              if (m.senderType === "IA") {
                // MENSAJE DE LA IA (Fondo índigo suave)
                return (
                  <div key={m.id} className="flex flex-col items-end ml-auto max-w-[75%]">
                    <div className="bg-indigo-50 border border-indigo-200/70 text-indigo-950 rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs shadow-xs">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 mb-1">
                        <Bot className="h-3 w-3" />
                        <span>Digloff Asistente (IA)</span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 pr-1">
                      {new Date(m.createdAt).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              }

              // MENSAJE MANUAL DEL EMPLEADO (Fondo oscuro slate-900)
              return (
                <div key={m.id} className="flex flex-col items-end ml-auto max-w-[75%]">
                  <div className="bg-slate-900 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs shadow-xs">
                    <div className="text-[10px] font-semibold text-slate-300 mb-1">
                      {m.senderUser?.name || currentUser.name}
                    </div>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 pr-1">
                    {new Date(m.createdAt).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Cuadro de Redacción */}
          <div className="p-3 border-t border-slate-200/80 bg-white">
            {/* Selector de Modo: WhatsApp vs Nota Interna */}
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setIsInternalNote(false)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  !isInternalNote
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <MessageSquare className="h-3 w-3" />
                <span>WhatsApp (Cliente)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInternalNote(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isInternalNote
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Lock className="h-3 w-3" />
                <span>Nota interna (Privada)</span>
              </button>

              {!isInternalNote && activeConversation.aiActive && (
                <span className="text-[11px] text-amber-600 ml-auto flex items-center gap-1">
                  <span>Al enviar a mano, la IA se pausará automáticamente</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows={2}
                placeholder={
                  isInternalNote
                    ? "Escribe una nota interna para el equipo (el cliente no la verá)..."
                    : "Escribe tu respuesta de WhatsApp (Enter para enviar)..."
                }
                className={`flex-1 p-2.5 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 resize-none ${
                  isInternalNote
                    ? "bg-amber-50/40 border-amber-200 focus:ring-amber-500"
                    : "bg-slate-50 border-slate-200 focus:ring-slate-900"
                }`}
              />
              <button
                type="submit"
                disabled={isSubmitting || !inputText.trim()}
                className={`px-4 rounded-xl font-medium text-white shadow-xs flex items-center justify-center transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isInternalNote ? "bg-amber-600 hover:bg-amber-700" : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
          <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-600">Selecciona una conversación</p>
          <p className="text-xs text-slate-400 mt-1">
            Escoge un chat de la lista izquierda para responder o consultar su ficha.
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* COLUMNA 3: FICHA LATERAL DEL CONTACTO (300px)           */}
      {/* ======================================================== */}
      {activeConversation && (
        <div className="w-72 lg:w-80 border-l border-slate-200/80 bg-white p-4 overflow-y-auto space-y-5 hidden md:block shrink-0">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Ficha del Contacto
            </h3>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Nombre</span>
                <p className="font-bold text-slate-900">
                  {activeConversation.contact?.name || "Sin nombre registrado"}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Teléfono</span>
                <p className="font-mono text-slate-700">+{activeConversation.contact?.phone}</p>
              </div>
              {activeConversation.contact?.email && (
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Email</span>
                  <p className="text-slate-700 truncate">{activeConversation.contact.email}</p>
                </div>
              )}
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Etapa Potencial</span>
                <div className="mt-0.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {activeConversation.contact?.stage}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vehículos Registrados */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Vehículos ({activeConversation.contact?.vehicles?.length || 0})
              </h3>
            </div>

            <div className="space-y-2">
              {activeConversation.contact?.vehicles?.map((v: any) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-xs text-slate-800">
                      {v.plate}
                    </span>
                    <span className="text-[10px] text-slate-400">{v.year || ""}</span>
                  </div>
                  <p className="font-bold text-slate-800">
                    {v.brand} {v.model}
                  </p>
                  {v.kilometers && (
                    <p className="text-[11px] text-slate-500">
                      {v.kilometers.toLocaleString("es-ES")} km
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Próximas Citas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Próximas Citas
              </h3>
            </div>

            <div className="space-y-2">
              {activeConversation.contact?.appointments?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No tiene citas agendadas.</p>
              ) : (
                activeConversation.contact?.appointments?.map((a: any) => (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                  >
                    <div className="font-semibold text-slate-800">
                      {new Date(a.startTime).toLocaleDateString("es-ES", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      -{" "}
                      {new Date(a.startTime).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{a.service?.name}</div>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      {a.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
