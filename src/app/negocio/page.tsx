import { AppLayout } from "@/components/layout/AppLayout";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BusinessManager } from "@/components/business/BusinessManager";

export const dynamic = "force-dynamic";

export default async function NegocioPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") redirect("/");

  const business = await prisma.business.findFirst({
    include: { schedules: true, holidays: true },
  });

  return (
    <AppLayout
      title="Datos del Taller & Negocio"
      subtitle="Información fiscal, comercial, dirección, elevadores y logotipo oficial"
    >
      <BusinessManager business={business} />
    </AppLayout>
  );
}
