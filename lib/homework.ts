"use client";

import { useMemo } from "react";

import { send, useApi } from "@/lib/api";
import type { Assignment, Session } from "@/lib/types";

export type LessonHomework = Assignment & {
  session: Session | undefined;
  isNew: boolean;
  isLate: boolean;
  state: Assignment["status"];
};

type Served = Assignment & { state: Assignment["status"] };

type Payload = { homework: Served[]; sessions: Session[] };

export function useMyHomework() {
  const { data, loading, refresh } = useApi<Payload>("/api/homework");

  const items = useMemo(() => {
    if (!data) return [];
    return data.homework.map<LessonHomework>((item) => ({
      ...item,
      session: data.sessions.find((session) => session.id === item.sessionId),
      isNew: !item.seen,
      isLate: item.state === "late",
    }));
  }, [data]);

  const markSeen = async (ids: string[]) => {
    await Promise.all(
      ids.map((id) => send(`/api/homework/${id}`, "PATCH", { seen: true })),
    );
    refresh();
  };

  const saveDraft = async (id: string, answer: string) => {
    await send(`/api/homework/${id}`, "PATCH", { answer });
    refresh();
  };

  const submitHomework = async (id: string, answer: string) => {
    await send(`/api/homework/${id}/submit`, "POST", { answer });
    refresh();
  };

  return { items, loading, markSeen, saveDraft, submitHomework };
}

export function useNewHomeworkCount(): number {
  return useMyHomework().items.filter((item) => item.isNew).length;
}

export type LessonGroup = { session: Session | undefined; items: LessonHomework[] };

export function groupByLesson(list: LessonHomework[]): LessonGroup[] {
  const groups = new Map<string, LessonGroup>();
  for (const item of list) {
    const group = groups.get(item.sessionId);
    if (group) group.items.push(item);
    else groups.set(item.sessionId, { session: item.session, items: [item] });
  }
  return [...groups.values()].sort((a, b) =>
    (b.session?.startUtc ?? "").localeCompare(a.session?.startUtc ?? ""),
  );
}
