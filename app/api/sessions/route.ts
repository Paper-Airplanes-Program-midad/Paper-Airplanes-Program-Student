import { requireActive } from "@/lib/actor";
import { ok, read } from "@/lib/db";
import type { Session, StoredSemester } from "@/lib/types";

export async function GET() {
  const user = await requireActive();
  if (user instanceof Response) return user;
  const [sessions, semester] = await Promise.all([
    read<Session[]>("sessions"),
    read<StoredSemester>("semester"),
  ]);
  return ok(
    sessions
      .filter((session) => session.semester === semester.id && session.studentName === user.name)
      .map((session) => ({
        ...session,
        joins: undefined,
        joinUrl: session.joinUrl ? `/api/sessions/${session.id}/join` : "",
      })),
  );
}
