"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { SuspendedScreen } from "@/components/portal/suspended";
import { PlaneMark } from "@/components/ui";
import { useAccess } from "@/lib/access";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { portal } from "@/lib/portal";

const OPEN_WHILE_WAITING = portal.home;

function openWhileWaiting(pathname: string) {
  return pathname === OPEN_WHILE_WAITING || pathname.startsWith(`${OPEN_WHILE_WAITING}/`);
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { ready } = useRequireAuth();
  const { status, loading, signedOut } = useAccess();
  const { signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const banned = status === "suspended";
  const waiting = !!status && !banned && status !== "active";
  const blocked = waiting && !openWhileWaiting(pathname);

  useEffect(() => {
    if (signedOut) void signOut().then(() => router.replace("/"));
  }, [signedOut, signOut, router]);

  useEffect(() => {
    if (blocked) router.replace(OPEN_WHILE_WAITING);
  }, [blocked, router]);

  if (banned) return <SuspendedScreen />;

  if (!ready || loading || blocked) {
    return (
      <div className="grid min-h-screen place-items-center">
        <PlaneMark className="h-10 w-10 animate-float" />
      </div>
    );
  }

  return <>{children}</>;
}
