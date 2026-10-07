import { requireActive } from "@/lib/actor";
import { ok, read } from "@/lib/db";
import type { Assignment, Session } from "@/lib/types";

export async function GET() {
  const user = await requireActive();
  if (user instanceof Response) return user;
  const [homework, sessions] = await Promise.all([
    read<Assignment[]>("homework"),
    read<Session[]>("sessions"),
  ]);
  const mine = homework
    .filter((item) => item.studentId === user.id)
    .sort((a, b) => b.assignedUtc.localeCompare(a.assignedUtc));
  const ids = new Set(mine.map((item) => item.sessionId));
  const now = new Date().toISOString();
  return ok({
    homework: mine.map((item) => ({
      ...item,
      state: item.status === "not_started" && item.dueUtc < now ? "late" : item.status,
    })),
    sessions: sessions.filter((s) => ids.has(s.id)),
  });
}
