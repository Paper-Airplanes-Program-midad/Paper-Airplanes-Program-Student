import { requireActive } from "@/lib/actor";
import { read, update } from "@/lib/db";
import { sessionState } from "@/lib/sessions";
import type { Session } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const back = Response.redirect(new URL("/learning", request.url), 303);
  const user = await requireActive();
  if (user instanceof Response) return back;

  const { id } = await params;
  const session = (await read<Session[]>("sessions")).find((entry) => entry.id === id);
  if (!session || session.studentName !== user.name || !session.joinUrl) return back;
  if (sessionState(session, Date.now()) !== "open") return back;

  const atUtc = new Date().toISOString();
  await update<Session[]>("sessions", (current) =>
    current.map((entry) =>
      entry.id === id
        ? { ...entry, joins: [...(entry.joins ?? []), { by: "student" as const, atUtc }] }
        : entry,
    ),
  );
  return Response.redirect(session.joinUrl, 303);
}
