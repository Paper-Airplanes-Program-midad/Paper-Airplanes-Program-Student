import { actor, unauthorized } from "@/lib/actor";
import { ok, read, update } from "@/lib/db";

type Store = Record<string, unknown>;

export async function GET() {
  const user = await actor();
  if (!user) return unauthorized();
  const store = await read<Store>("training-progress");
  return ok(store[user.id] ?? { units: {} });
}

export async function PUT(request: Request) {
  const user = await actor();
  if (!user) return unauthorized();
  const progress = await request.json();
  const store = await update<Store>("training-progress", (current) => ({
    ...current,
    [user.id]: progress,
  }));
  return ok(store[user.id]);
}
