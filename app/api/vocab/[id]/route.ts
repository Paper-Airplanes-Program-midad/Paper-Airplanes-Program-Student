import { requireActive } from "@/lib/actor";
import { ok, update } from "@/lib/db";
import type { VocabWord } from "@/lib/types";

type Bank = Record<string, VocabWord[]>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireActive();
  if (user instanceof Response) return user;
  const { box } = (await request.json()) as { box: number };
  const bank = await update<Bank>("vocab", (current) => ({
    ...current,
    [user.id]: (current[user.id] ?? []).map((word) =>
      word.id === id
        ? { ...word, box, lastReviewedAt: new Date().toISOString() }
        : word,
    ),
  }));
  return ok(bank[user.id]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireActive();
  if (user instanceof Response) return user;
  const bank = await update<Bank>("vocab", (current) => ({
    ...current,
    [user.id]: (current[user.id] ?? []).filter((word) => word.id !== id),
  }));
  return ok(bank[user.id]);
}
