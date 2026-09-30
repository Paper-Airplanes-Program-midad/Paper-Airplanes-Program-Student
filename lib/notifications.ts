"use client";

import { useMemo } from "react";

import { send, useApi } from "@/lib/api";
import { useUnfiledWeeks } from "@/lib/checkin";
import { useNow } from "@/lib/client";
import { useMyHomework } from "@/lib/homework";
import { useI18n, type L } from "@/lib/i18n";
import { sessionTitle, weekPlan } from "@/lib/sessions";
import type { Announcement, Semester, Session } from "@/lib/types";

export type NotificationKind =
  | "homework"
  | "grade"
  | "lesson"
  | "incident"
  | "person"
  | "announcement";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string | null;
  whenUtc: string | null;
  read: boolean;
};

export function useNotifications() {
  const { t, tv } = useI18n();
  const { items: homework } = useMyHomework();
  const unfiled = useUnfiledWeeks();
  const { data: me } = useApi<{ semester: Semester }>("/api/me");
  const { data: sessions } = useApi<Session[]>("/api/sessions");
  const { data: announcements } = useApi<Announcement[]>("/api/announcements");
  const { data: read, refresh } = useApi<string[]>("/api/notifications/read");
  const now = useNow(60_000);

  const items = useMemo(() => {
    const list: Omit<Notification, "read">[] = [];
    const text = (value: L) => tv(value) || value.ar || value.en;

    for (const item of announcements ?? []) {
      list.push({
        id: `ann-${item.id}`,
        kind: "announcement",
        title: text(item.subject),
        body: text(item.body),
        href: null,
        whenUtc: item.sentUtc,
      });
    }

    for (const item of homework) {
      const lesson = item.session ? ` · ${tv(item.session.topic)}` : "";
      if (item.isNew) {
        list.push({
          id: `hw-${item.id}`,
          kind: "homework",
          title: t("notif.newhw"),
          body: `${tv(item.title)}${lesson}`,
          href: "/assignments",
          whenUtc: item.assignedUtc,
        });
      }
      if (item.state === "graded" && item.score !== null) {
        list.push({
          id: `grade-${item.id}`,
          kind: "grade",
          title: t("notif.graded"),
          body: `${tv(item.title)} · ${item.score}/${item.maxScore}`,
          href: "/assignments",
          whenUtc: item.gradedUtc ?? item.dueUtc,
        });
      }
    }

    const next = sessions
      ?.filter((session) => session.status === "scheduled" && Date.parse(session.startUtc) > now)
      .sort((a, b) => a.startUtc.localeCompare(b.startUtc))[0];
    if (next) {
      list.push({
        id: `lesson-${next.id}`,
        kind: "lesson",
        title: t("notif.lesson"),
        body: `${sessionTitle(next, t, tv)} · ${next.level}`,
        href: "/learning",
        whenUtc: next.startUtc,
      });
    }

    const week = me?.semester.weeks.find((entry) => entry.week === me.semester.currentWeek);
    const ready =
      week && !weekPlan((sessions ?? []).filter((s) => s.week === week.week), now).opensAt;
    if (week && ready && unfiled.includes(week.week)) {
      list.push({
        id: `checkin-${me?.semester.id}-${week.week}`,
        kind: "lesson",
        title: t("notif.checkin"),
        body: `${t("common.week")} ${week.week}`,
        href: "/attendance",
        whenUtc: `${week.start}T00:00:00Z`,
      });
    }

    const seen = new Set(read ?? []);
    return list
      .map((item) => ({ ...item, read: seen.has(item.id) }))
      .sort((a, b) => (b.whenUtc ?? "").localeCompare(a.whenUtc ?? ""));
  }, [homework, sessions, announcements, unfiled, me, read, now, t, tv]);

  const markAllRead = async () => {
    const ids = items.filter((item) => !item.read).map((item) => item.id);
    if (!ids.length) return;
    await send("/api/notifications/read", "POST", { ids });
    refresh();
  };

  return { items, markAllRead };
}
