import { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import prisma from "@/lib/prisma";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export async function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Obtenemos conteos para los badges de la barra lateral
  const [unreadCount, needsAttentionCount, aiSetting] = await Promise.all([
    prisma.conversation.count({
      where: { status: "ABIERTA", unreadCount: { gt: 0 } },
    }),
    prisma.conversation.count({
      where: { status: "ABIERTA", needsHumanAttention: true },
    }),
    prisma.aiSetting.findFirst(),
  ]);

  return (
    <div className="flex min-h-dvh w-full flex-col overflow-hidden bg-slate-50 font-sans md:h-dvh md:flex-row">
      <AppSidebar
        user={user}
        unreadConversationsCount={unreadCount}
        needsAttentionCount={needsAttentionCount}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          title={title}
          subtitle={subtitle}
          aiEnabled={aiSetting?.enabled ?? true}
        />
        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3 pb-24 sm:p-6 sm:pb-24 md:pb-6">
          <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
