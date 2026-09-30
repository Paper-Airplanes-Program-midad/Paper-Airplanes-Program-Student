import { requireActive } from "@/lib/actor";
import { newId, ok, read, update } from "@/lib/db";
import type { VocabWord } from "@/lib/types";

type Bank = Record<string, VocabWord[]>;

export async function GET() {
  const user = await requireActive();
  if (user instanceof Response) return user;
  const bank = await read<Bank>("vocab");
  return ok(bank[user.id] ?? []);
}

export async function POST(request: Request) {
  const user = await requireActive();
  if (user instanceof Response) return user;
  const body = (await request.json()) as Pick<
    VocabWord,
    "term" | "translation" | "context" | "source"
  >;
  const word: VocabWord = {
    ...body,
    id: newId("v"),
    createdAt: new Date().toISOString(),
    box: 1,
    lastReviewedAt: null,
  };
  const bank = await update<Bank>("vocab", (current) => ({
    ...current,
    [user.id]: [word, ...(current[user.id] ?? [])],
  }));
  return ok(bank[user.id], 201);
}
