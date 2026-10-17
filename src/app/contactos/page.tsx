import { AppLayout } from "@/components/layout/AppLayout";
import prisma from "@/lib/prisma";
import { ContactsManager } from "@/components/contacts/ContactsManager";

export const dynamic = "force-dynamic";

export default async function ContactosPage() {
  const contacts = await prisma.contact.findMany({
    include: {
      vehicles: true,
      appointments: {
        include: { service: true },
        orderBy: { startTime: "desc" },
      },
      conversations: {
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppLayout
      title="Contactos & Vehículos"
      subtitle="Directorio de clientes, matrículas y fichas técnicas del taller"
    >
      <ContactsManager initialContacts={contacts} />
    </AppLayout>
  );
}
