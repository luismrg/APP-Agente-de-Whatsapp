import { AppLayout } from "@/components/layout/AppLayout";
import prisma from "@/lib/prisma";
import { CalendarManager } from "@/components/calendar/CalendarManager";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const [appointments, contacts, services, employees, business] = await Promise.all([
    prisma.appointment.findMany({
      include: {
        contact: {
          include: { vehicles: true },
        },
        vehicle: true,
        service: true,
        assignedToUser: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startTime: "asc" },
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
    prisma.business.findFirst(),
  ]);

  return (
    <AppLayout
      title="Calendario de Taller"
      subtitle="Planificación de boxes, elevadores de trabajo y citas confirmadas"
    >
      <CalendarManager
        initialAppointments={appointments}
        contacts={contacts}
        services={services}
        employees={employees}
        capacity={business?.defaultCapacity || 2}
      />
    </AppLayout>
  );
}
