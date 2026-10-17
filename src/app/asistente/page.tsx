import { AppLayout } from "@/components/layout/AppLayout";
import prisma from "@/lib/prisma";
import { AiAssistantSettings } from "@/components/ai/AiAssistantSettings";

export const dynamic = "force-dynamic";

export default async function AsistentePage() {
  const [aiSetting, business, services, aiLogs] = await Promise.all([
    prisma.aiSetting.findFirst(),
    prisma.business.findFirst({ include: { schedules: true, holidays: true } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.aiLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const apiKeyConfigured = Boolean(
    process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim() !== ""
  );

  return (
    <AppLayout
      title="Asistente de IA & WhatsApp"
      subtitle="Supervisión del modelo de OpenRouter, personalidad, servicios, horarios y simulador de prueba"
    >
      <AiAssistantSettings
        initialSetting={aiSetting}
        business={business}
        services={services}
        apiKeyConfigured={apiKeyConfigured}
        aiLogs={aiLogs}
      />
    </AppLayout>
  );
}
