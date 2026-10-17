import { AppLayout } from "@/components/layout/AppLayout";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersManager } from "@/components/users/UsersManager";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <AppLayout
      title="Usuarios & Equipo del Taller"
      subtitle="Administración de cuentas de acceso, roles y permisos de empleados"
    >
      <UsersManager initialUsers={users} currentUserId={currentUser.id} />
    </AppLayout>
  );
}
