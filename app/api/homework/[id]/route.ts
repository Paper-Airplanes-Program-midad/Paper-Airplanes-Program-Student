import { requireActive } from "@/lib/actor";
import { fail, ok, update } from "@/lib/db";
import type { Assignment } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireActive();
  if (user instanceof Response) return user;
  const patch = (await request.json()) as { seen?: boolean; answer?: string };

  let found = false;
  const rows = await update<Assignment[]>("homework", (current) =>
    current.map((item) => {
      if (item.id !== id || item.studentName !== user.name) return item;
      found = true;
      return {
        ...item,
        seen: patch.seen ?? item.seen,
        answer: patch.answer ?? item.answer ?? null,
      };
    }),
  );
  if (!found) return fail("No such homework", 404);
  return ok(rows.find((item) => item.id === id));
}
