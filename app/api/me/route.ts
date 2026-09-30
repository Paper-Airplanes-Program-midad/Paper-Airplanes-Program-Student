import { actor, unauthorized } from "@/lib/actor";
import { ok, read } from "@/lib/db";
import { withWeeks } from "@/lib/semester";
import type {
  AttendanceSummary,
  CheckIn,
  Enrollment,
  Pair,
  Semester,
  StoredSemester,
  TutorProfile,
} from "@/lib/types";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

async function tutorFor(pair: Pair | undefined): Promise<TutorProfile | null> {
  if (!pair) return null;

  const profile = await read<TutorProfile>("tutor-profile").catch(() => null);
  if (profile?.name === pair.tutor) return profile;

  return {
    id: pair.pairId,
    name: pair.tutor,
    initials: initialsOf(pair.tutor),
    country: { en: "", ar: "" },
    timezone: pair.tutorTz,
    languages: [],
    bio: { en: "", ar: "" },
  };
}

function summarise(mine: CheckIn[], semester: Semester): AttendanceSummary {
  const byWeek = new Map(mine.map((row) => [row.week, row]));

  const weeks = semester.weeks
    .filter((entry) => entry.week <= semester.currentWeek)
    .map((entry) => {
      const row = byWeek.get(entry.week);
      const status = row ? (row.held ? "attended" : "missed") : "pending";
      return { week: `W${entry.week}`, status: status as "attended" | "missed" | "pending" };
    });

  const attended = mine.filter((row) => row.held).length;
  const missed = mine.filter((row) => !row.held).length;
  const totalSessions = attended + missed;

  let streak = 0;
  for (let i = weeks.length - 1; i >= 0 && weeks[i].status === "attended"; i--) streak++;

  return {
    totalSessions,
    attended,
    missed,
    rate: totalSessions ? Math.round((attended / totalSessions) * 100) : 0,
    streak,
    weeks,
  };
}

export async function GET() {
  const user = await actor();
  if (!user) return unauthorized();

  const [pairs, checkins, enrollment, stored] = await Promise.all([
    read<Pair[]>("pairs"),
    read<CheckIn[]>("checkins"),
    read<Enrollment>("enrollment"),
    read<StoredSemester>("semester"),
  ]);

  const semester = withWeeks(stored);
  const pair = pairs.find((entry) => entry.student === user.name);
  const mine = checkins.filter(
    (row) =>
      row.semester === semester.id && row.by === "student" && row.studentName === user.name,
  );

  return ok({
    user,
    tutor: await tutorFor(pair),
    enrollment,
    attendance: summarise(mine, semester),
    semester,
  });
}
