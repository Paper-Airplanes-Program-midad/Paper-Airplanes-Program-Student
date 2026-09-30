import { actor, unauthorized } from "@/lib/actor";
import { applicationFor, newReference, saveApplication } from "@/lib/applications";
import { ok, fail, read, update } from "@/lib/db";
import { settings } from "@/lib/settings";
import { readyUnits } from "@/lib/training";
import type { Account, Role } from "@/lib/users";

type Progress = Record<string, { units?: Record<string, { completedAt?: string }> }>;

export async function POST() {
  const user = await actor();
  if (!user) return unauthorized();

  const application = await applicationFor(user.id, user.role as Role);
  if (application.status === "pending") return fail("already_sent", 409);
  if (application.status === "approved") return fail("already_approved", 409);

  const { intake } = await settings();
  if (!intake.open) return fail("intake_closed", 403);

  const progress = await read<Progress>("training-progress");
  const units = progress[user.id]?.units ?? {};
  const unfinished = readyUnits
    .filter((unit) => !units[unit.slug]?.completedAt)
    .map((unit) => unit.slug);

  if (unfinished.length) return ok({ ok: false, unfinished });

  const sent = await saveApplication({
    ...application,
    status: "pending",
    submittedUtc: new Date().toISOString(),
    reason: null,
    reference: application.reference ?? newReference(),
  });

  await update<Account[]>("users", (current) =>
    current.map((entry) => (entry.id === user.id ? { ...entry, status: "pending" } : entry)),
  );

  return ok({ ok: true, application: sent });
}
