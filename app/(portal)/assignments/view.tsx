"use client";

import {
  Download,
  FileAudio,
  FileImage,
  FileText,
  Paperclip,
  Sparkles,
  Upload,
} from "lucide-react";
import { useState, type ComponentType } from "react";

import { AppShell } from "@/components/portal/app-shell";
import {
  EmptyState,
  Loading,
  SectionCard,
  StatCard,
  StatusPill,
} from "@/components/portal/kit";
import { VocabCapture } from "@/components/portal/vocab-capture";
import { Button, Reveal, Textarea, cn, useToast } from "@/components/ui";
import {
  groupByLesson,
  useMyHomework,
  type LessonHomework,
} from "@/lib/homework";
import { useI18n } from "@/lib/i18n";
import type { HomeworkFile } from "@/lib/types";
import { studentNav } from "@/lib/nav";
import { formatDate, relativeDays } from "@/lib/time";

const STATUS_LABEL: Record<LessonHomework["state"], string> = {
  not_started: "training.available",
  submitted: "hw.awaiting",
  late: "hw.late",
  graded: "hw.gradedcount",
};

const FILE_ICON: Record<HomeworkFile["kind"], ComponentType<{ className?: string }>> = {
  pdf: FileText,
  doc: FileText,
  image: FileImage,
  audio: FileAudio,
};

const DONE: LessonHomework["state"][] = ["submitted", "graded"];

type Filter = "all" | "todo" | "done";

function tone(state: LessonHomework["state"]) {
  if (state === "graded") return "success" as const;
  if (state === "submitted") return "info" as const;
  if (state === "late") return "danger" as const;
  return "warning" as const;
}

export function AssignmentsView() {
  const { t, tv, locale } = useI18n();
  const toast = useToast();

  const { items: homework, loading, markSeen, saveDraft, submitHomework } = useMyHomework();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("all");

  const fresh = homework.filter((item) => item.isNew);
  const openCount = homework.filter(
    (item) => item.state === "not_started" || item.state === "late",
  ).length;
  const awaiting = homework.filter((item) => item.state === "submitted").length;
  const graded = homework.filter((item) => item.state === "graded").length;
  const done = awaiting + graded;

  const visible = homework.filter((item) =>
    filter === "all" ? true : DONE.includes(item.state) === (filter === "done"),
  );
  const lessons = groupByLesson(visible);

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: t("hw.filterall"), count: homework.length },
    { value: "todo", label: t("hw.filtertodo"), count: openCount },
    { value: "done", label: t("hw.filterdone"), count: done },
  ];

  return (
    <AppShell
      nav={studentNav}
      title={t("nav.assignments")}
      description={t("hw.pagedesc")}
    >
      {fresh.length > 0 && (
        <Reveal>
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 p-5">
              <div className="flex min-w-0 gap-3">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
                  style={{
                    background: "color-mix(in oklab, var(--accent) 12%, transparent)",
                    borderColor: "color-mix(in oklab, var(--accent) 26%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-extrabold text-fg">
                    {t("hw.newbanner")}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-fg-muted">{t("hw.newdesc")}</p>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {fresh.map((item) => (
                      <li key={item.id} className="text-[13px] text-fg">
                        <span className="font-bold">{tv(item.title)}</span>
                        {item.session && (
                          <span className="text-fg-subtle">
                            {" · "}
                            {t("common.week")} {item.session.week} ·{" "}
                            {tv(item.session.topic)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => markSeen(fresh.map((item) => item.id))}
              >
                {t("hw.gotit")}
              </Button>
            </div>
          </section>
        </Reveal>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("hw.openwork")} value={openCount} accent="var(--accent)" />
        <StatCard
          label={t("hw.awaiting")}
          value={awaiting}
          accent="var(--accent-cool)"
          delay={90}
        />
        <StatCard
          label={t("hw.gradedcount")}
          value={graded}
          accent="var(--accent-mint)"
          delay={180}
        />
      </div>

      <Reveal delay={240}>
        <div className="flex flex-wrap gap-2">
          {filters.map((option) => {
            const active = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-bold transition-all duration-300",
                  active
                    ? "border-transparent bg-tint-2 text-fg ring-2 ring-dawn-400"
                    : "border-line bg-tint text-fg-muted hover:border-line-strong",
                )}
              >
                {option.label}
                <span className="text-[11.5px] tabular-nums text-fg-subtle">
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {loading && <Loading />}

      {!loading && lessons.length === 0 && (
        <EmptyState
          message={homework.length === 0 ? t("hw.emptystudent") : t("hw.nomatch")}
        />
      )}

      {lessons.map((group, index) => {
        const session = group.session;
        return (
          <SectionCard
            key={session?.id ?? index}
            title={
              session
                ? `${t("common.week")} ${session.week} · ${tv(session.topic)}`
                : t("nav.assignments")
            }
            description={
              session
                ? `${formatDate(session.startUtc, locale)} · ${session.level} · ${t("lesson.unit")} ${session.unitNo}`
                : undefined
            }
            action={
              <StatusPill tone="neutral">
                {group.items.length}{" "}
                {t(group.items.length === 1 ? "hw.items" : "hw.itemsmany")}
              </StatusPill>
            }
            delay={index * 60}
            className="[&>div:last-child]:p-0"
          >
            <ul className="divide-y divide-line">
              {group.items.map((item) => {
                const answer = drafts[item.id] ?? item.answer ?? "";
                return (
                  <li key={item.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-[14px] font-extrabold text-fg">
                          {tv(item.title)}
                          {item.isNew && (
                            <StatusPill tone="accent">{t("hw.new")}</StatusPill>
                          )}
                        </p>
                        <p className="mt-1 text-[11.5px] text-fg-subtle">
                          {t("hw.assigned")} {formatDate(item.assignedUtc, locale)} ·{" "}
                          {t("common.due")} {formatDate(item.dueUtc, locale)} (
                          {relativeDays(item.dueUtc, locale)})
                        </p>
                      </div>
                      <StatusPill tone={tone(item.state)}>
                        {item.state === "graded" && item.score !== null
                          ? `${item.score}/${item.maxScore}`
                          : t(STATUS_LABEL[item.state])}
                      </StatusPill>
                    </div>

                    <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
                      {tv(item.instructions)}
                    </p>

                    {item.files.length > 0 && (
                      <ul className="mt-4 flex flex-col gap-2">
                        {item.files.map((file) => {
                          const Icon = FILE_ICON[file.kind];
                          return (
                            <li
                              key={file.id}
                              className="row flex items-center justify-between gap-3 p-3"
                            >
                              <span className="flex min-w-0 items-center gap-2.5">
                                <Icon className="h-4 w-4 shrink-0 text-fg-faint" />
                                <span className="min-w-0">
                                  <span className="block truncate text-[13px] font-semibold text-fg">
                                    {file.name}
                                  </span>
                                  <span className="block text-[11px] text-fg-subtle">
                                    {file.sizeKb} KB
                                  </span>
                                </span>
                              </span>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => toast.success(t("hw.downloaded"))}
                              >
                                <Download className="h-4 w-4" />
                                {t("hw.download")}
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {(item.state === "not_started" || item.state === "late") && (
                      <div className="mt-4">
                        <Textarea
                          label={t("hw.yoursubmission")}
                          className="min-h-32"
                          placeholder={t("student.answerhere")}
                          value={answer}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            disabled={answer.trim().length === 0}
                            onClick={async () => {
                              await submitHomework(item.id, answer);
                              toast.success(t("student.assignmentsent"));
                            }}
                          >
                            <Upload className="h-4 w-4" />
                            {t("common.submit")}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={async () => {
                              await saveDraft(item.id, answer);
                              toast.info(t("student.draftsaved"));
                            }}
                          >
                            {t("common.save")}
                          </Button>
                        </div>
                      </div>
                    )}

                    {item.state === "submitted" && (
                      <p className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-tint p-4 text-[13px] text-fg-muted">
                        <Paperclip className="h-4 w-4 shrink-0 text-fg-faint" />
                        {t("hw.awaitingnote")}
                      </p>
                    )}

                    {item.state === "graded" && (
                      <div className="mt-4 rounded-2xl border border-line bg-tint p-4">
                        <ul className="flex flex-col gap-2.5">
                          {item.rubric.map((criterion) => (
                            <li
                              key={criterion.id}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="min-w-0 truncate text-[13px] text-fg-muted">
                                {tv(criterion.criterion)}
                              </span>
                              <span className="shrink-0 text-[13px] font-extrabold tabular-nums text-fg">
                                {criterion.points}/{criterion.max}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {item.feedback && (
                          <p className="mt-3 border-t border-line pt-3 text-[13px] leading-relaxed text-fg-muted">
                            {item.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        );
      })}

      <VocabCapture source="Homework · assignments" />
    </AppShell>
  );
}
