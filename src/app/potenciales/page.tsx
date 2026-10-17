import { AppLayout } from "@/components/layout/AppLayout";
import prisma from "@/lib/prisma";
import { KanbanBoard } from "@/components/leads/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function PotencialesPage() {
  const [leads, contacts, services, employees] = await Promise.all([
    prisma.lead.findMany({
      include: {
        contact: {
          include: { vehicles: true },
        },
        service: true,
        assignedToUser: {
          select: { id: true, name: true },
        },
      },
      orderBy: { lastActivityAt: "desc" },
    }),
    prisma.contact.findMany({
      include: { vehicles: true },
      orderBy: { name: "asc" },
    }),
    prisma.service.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <AppLayout
      title="Potenciales & Oportunidades"
      subtitle="Embudo de ventas comercial y seguimiento de estados de clientes del taller"
    >
      <KanbanBoard
        initialLeads={leads}
        contacts={contacts}
        services={services}
        employees={employees}
      />
    </AppLayout>
  );
}
