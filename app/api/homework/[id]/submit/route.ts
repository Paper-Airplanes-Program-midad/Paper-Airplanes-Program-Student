import { requireActive } from "@/lib/actor";
import { fail, ok, update } from "@/lib/db";
import type { Assignment } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireActive();
  if (user instanceof Response) return user;
  const { answer } = (await request.json()) as { answer: string };

  let found = false;
  const now = new Date().toISOString();
  const rows = await update<Assignment[]>("homework", (current) =>
    current.map((item) => {
      if (item.id !== id || item.studentId !== user.id) return item;
      found = true;
      return {
        ...item,
        answer,
        seen: true,
        submittedUtc: now,
        status: now > item.dueUtc ? "late" : "submitted",
      };
    }),
  );
  if (!found) return fail("No such homework", 404);
  return ok(rows.find((item) => item.id === id));
}
