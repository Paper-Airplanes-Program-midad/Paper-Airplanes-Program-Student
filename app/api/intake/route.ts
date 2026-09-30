import { actor, unauthorized } from "@/lib/actor";
import { ok } from "@/lib/db";
import { settings } from "@/lib/settings";

export async function GET() {
  if (!(await actor())) return unauthorized();

  const { intake } = await settings();
  return ok({ open: intake.open, message: intake.message });
}
