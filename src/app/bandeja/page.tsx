import { AppLayout } from "@/components/layout/AppLayout";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ChatwootInbox } from "@/components/inbox/ChatwootInbox";

export const dynamic = "force-dynamic";

interface BandejaPageProps {
  searchParams: Promise<{ chat?: string; filtro?: string }>;
}

export default async function BandejaPage({ searchParams }: BandejaPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resolvedParams = await searchParams;
  const selectedChatId = resolvedParams.chat;

  const [conversations, employees] = await Promise.all([
    prisma.conversation.findMany({
      include: {
        contact: {
          include: {
            vehicles: true,
            appointments: {
              where: { status: { not: "CANCELADA" } },
              include: { service: true },
              orderBy: { startTime: "asc" },
            },
          },
        },
        assignedToUser: {
          select: { id: true, name: true, role: true },
        },
        messages: {
          include: {
            senderUser: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true },
    }),
  ]);

  return (
    <AppLayout
      title="Bandeja de Entrada de WhatsApp"
      subtitle="Atención de clientes en tiempo real, asignación de equipo y supervisión de IA"
    >
      <ChatwootInbox
        initialConversations={conversations}
        currentUser={user}
        employees={employees}
        selectedChatId={selectedChatId}
      />
    </AppLayout>
  );
}
