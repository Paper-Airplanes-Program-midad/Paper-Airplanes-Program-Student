"use client";

import { useState } from "react";

import { AppShell } from "@/components/portal/app-shell";
import { JoinButton, SessionPill } from "@/components/portal/session";
import { EmptyState, Loading, Row, SectionCard, StatusPill, statusTone } from "@/components/portal/kit";
import { VocabCapture } from "@/components/portal/vocab-capture";
import { Avatar, Progress, Reveal, Select } from "@/components/ui";
import { useApi } from "@/lib/api";
import { useDeviceTimezone, useNow } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import { sessionState, sessionTitle } from "@/lib/sessions";
import type { Enrollment, Session, TutorProfile } from "@/lib/types";
import { studentNav } from "@/lib/nav";
import { formatDayInTz, formatInTz, timezoneOptions, zoneLabel } from "@/lib/time";

export function LearningView() {
  const { t, tv, locale } = useI18n();
  const deviceTz = useDeviceTimezone("Asia/Damascus");
  const [picked, setPicked] = useState<string | null>(null);
  const tz = picked ?? deviceTz;
  const now = useNow();

  const { data: me } = useApi<{ tutor: TutorProfile | null; enrollment: Enrollment }>(
    "/api/me",
  );
  const { data: mine } = useApi<Session[]>("/api/sessions");

  if (!me || !mine) {
    return (
      <AppShell nav={studentNav} title={t("nav.learning")} description={t("common.loading")}>
        <Loading rows={4} />
      </AppShell>
    );
  }

  const { enrollment, tutor: tutorProfile } = me;
  const upcoming = mine
    .filter((s) => Date.parse(s.endUtc) >= now)
    .sort((a, b) => a.startUtc.localeCompare(b.startUtc));
  const next = upcoming.find((s) => s.status !== "cancelled");

  return (
    <AppShell
      nav={studentNav}
      title={t("nav.learning")}
      description={`${tv(enrollment.programType)} · ${enrollment.cohort}`}
      actions={
        <Select
          aria-label={t("common.timezone")}
          value={tz}
          onChange={(event) => setPicked(event.target.value)}
          options={timezoneOptions.map((zone) => ({ value: zone, label: zone }))}
          className="hidden h-9 w-44 sm:block"
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <div className="always-dark relative h-full overflow-hidden rounded-3xl p-7">
            <div className="grid-bg absolute inset-0" />
            <div className="relative">
              <span className="text-[11px] font-bold tracking-[0.15em] text-accent-cool uppercase">
                {t("student.nextlesson")}
              </span>
              {!next && (
                <p className="mt-3 text-[14px] text-fg-muted">{t("sched.nonext")}</p>
              )}
              {next && (
                <>
                  <h2 className="mt-3 text-2xl leading-tight font-extrabold tracking-[-0.02em] text-fg">
                    {sessionTitle(next, t, tv)}
                  </h2>
                  <p className="mt-3 text-[13.5px] text-fg-muted">
                    {formatDayInTz(next.startUtc, tz, locale)} ·{" "}
                    {formatInTz(next.startUtc, tz, locale)}–
                    {formatInTz(next.endUtc, tz, locale)} {zoneLabel(next.startUtc, tz)} (
                    {t("common.yourtime")})
                  </p>
                  {tutorProfile && (
                    <p className="text-[12px] text-fg-subtle">
                      {formatInTz(next.startUtc, tutorProfile.timezone, locale)}{" "}
                      {zoneLabel(next.startUtc, tutorProfile.timezone)} ({t("common.tutortime")}
                      )
                    </p>
                  )}
                  <JoinButton
                    session={next}
                    href={next.joinUrl || null}
                    now={now}
                    className="mt-6"
                  />
                  {sessionState(next, now) !== "open" && (
                    <p className="mt-2 text-[12px] text-fg-subtle">
                      {t(next.joinUrl ? "sched.joinsoon" : "sched.nolink")}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <div className="panel h-full p-6">
            <span className="text-[11px] font-bold tracking-[0.15em] text-fg-faint uppercase">
              {t("student.yourtutor")}
            </span>
            {tutorProfile ? (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <Avatar
                    initials={tutorProfile.initials}
                    accent="var(--accent)"
                    className="h-12 w-12 text-[13px]"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-extrabold text-fg">
                      {tutorProfile.name}
                    </p>
                    <p className="truncate text-[12px] text-fg-subtle">
                      {[tv(tutorProfile.country), tutorProfile.timezone].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
                {tv(tutorProfile.bio) && (
                  <p className="mt-4 text-[13px] leading-relaxed text-fg-muted">
                    {tv(tutorProfile.bio)}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tutorProfile.languages.map((language) => (
                    <StatusPill key={language} tone="info">
                      {language}
                    </StatusPill>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-4 text-[13px] leading-relaxed text-fg-muted">{t("student.notutor")}</p>
            )}
          </div>
        </Reveal>
      </div>

      <SectionCard title={t("student.schedule")} description={tz}>
        {upcoming.length === 0 && <EmptyState message={t("sched.nonext")} />}
        <ul className="flex flex-col gap-3">
          {upcoming.map((session) => (
            <Row key={session.id}>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-bold text-fg">
                  {sessionTitle(session, t, tv)}
                </p>
                <p className="truncate text-[11.5px] text-fg-subtle">
                  {formatDayInTz(session.startUtc, tz, locale)} ·{" "}
                  {formatInTz(session.startUtc, tz, locale)} {zoneLabel(session.startUtc, tz)}
                  {tutorProfile &&
                    ` · ${formatInTz(session.startUtc, tutorProfile.timezone, locale)} ${zoneLabel(session.startUtc, tutorProfile.timezone)}`}
                </p>
              </div>
              <SessionPill session={session} now={now} />
            </Row>
          ))}
        </ul>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title={t("student.curriculum")}
          description={`${t("common.level")} ${enrollment.currentLevel}`}
        >
          <div className="flex flex-col gap-4">
            {enrollment.levels.map((level) => (
              <div key={level.code}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-extrabold text-fg">{level.code}</span>
                  <StatusPill tone={statusTone(level.status)}>{level.progress}%</StatusPill>
                </div>
                <Progress
                  value={level.progress}
                  className="mt-2"
                  accent={
                    level.status === "completed" ? "var(--accent-mint)" : "var(--accent-cool)"
                  }
                  label={level.code}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={t("student.exams")} delay={80}>
          <ul className="flex flex-col gap-3">
            {(
              [
                ["Midterm", enrollment.exams.midterm],
                ["Final", enrollment.exams.final],
              ] as const
            ).map(([label, exam]) => (
              <Row key={label}>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-fg">{label}</p>
                  <p className="text-[11.5px] text-fg-subtle">
                    {formatDayInTz(exam.scheduledAt, tz, locale)} ·{" "}
                    {formatInTz(exam.scheduledAt, tz, locale)}
                  </p>
                </div>
                <StatusPill tone={statusTone(exam.status)}>
                  {exam.score !== null ? `${exam.score}%` : exam.status}
                </StatusPill>
              </Row>
            ))}
          </ul>
        </SectionCard>
      </div>

      <VocabCapture source="Lesson · learning dashboard" />
    </AppShell>
  );
}
