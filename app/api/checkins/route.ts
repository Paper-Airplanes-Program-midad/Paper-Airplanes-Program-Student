import { requireActive } from "@/lib/actor";
import { fail, newId, ok, read, update } from "@/lib/db";
import { readReport, withWeeks } from "@/lib/semester";
import type { CheckIn, Pair, StoredSemester } from "@/lib/types";

function mine(rows: CheckIn[], semester: string, studentName: string) {
  return rows
    .filter(
      (row) =>
        row.semester === semester && row.by === "student" && row.studentName === studentName,
    )
    .sort((a, b) => b.week - a.week);
}

export async function GET() {
  const user = await requireActive();
  if (user instanceof Response) return user;
  const [rows, semester] = await Promise.all([
    read<CheckIn[]>("checkins"),
    read<StoredSemester>("semester"),
  ]);
  return ok(mine(rows, semester.id, user.name));
}

export async function POST(request: Request) {
  const user = await requireActive();
  if (user instanceof Response) return user;

  const [pairs, stored] = await Promise.all([
    read<Pair[]>("pairs"),
    read<StoredSemester>("semester"),
  ]);
  const semester = withWeeks(stored);
  const pair = pairs.find((entry) => entry.student === user.name);
  if (!pair) return fail("not_paired", 409);

  const body = (await request.json()) as { week?: unknown };
  const week = body.week;
  if (typeof week !== "number" || !Number.isInteger(week)) return fail("bad_week");
  if (week < 1 || week > semester.currentWeek) return fail("week_closed");

  const report = readReport(body, semester.absenceReasons);
  if (!report) return fail("bad_report");

  let locked = false;
  const rows = await update<CheckIn[]>("checkins", (current) => {
    locked = current.some(
      (row) =>
        row.semester === semester.id &&
        row.week === week &&
        row.by === "student" &&
        row.studentName === user.name,
    );
    if (locked) return current;
    return [
      {
        id: newId("chk"),
        semester: semester.id,
        week,
        by: "student",
        studentName: user.name,
        tutorName: pair.tutor,
        ...report,
        submittedUtc: new Date().toISOString(),
      },
      ...current,
    ];
  });

  if (locked) return fail("locked", 409);
  return ok(mine(rows, semester.id, user.name));
}
