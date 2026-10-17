export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Inicialización del motor de WhatsApp en el proceso de Node
    const { startWhatsAppSocket } = await import("@/lib/whatsapp/singleton");
    console.log("[Digloff] Registrando proceso en segundo plano de WhatsApp Baileys...");
    startWhatsAppSocket(false).catch((err) => {
      console.error("[Digloff] Error al arrancar Baileys:", err);
    });
  }
}
