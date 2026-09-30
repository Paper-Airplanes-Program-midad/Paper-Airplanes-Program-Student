"use client";

import { CalendarCheck, Lock } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/portal/app-shell";
import {
  EmptyState,
  Loading,
  Row,
  SectionCard,
  StatCard,
  StatusPill,
} from "@/components/portal/kit";
import { Button, Input, Radio, Select, Textarea, useToast } from "@/components/ui";
import { useApi } from "@/lib/api";
import { useDeviceTimezone, useNow } from "@/lib/client";
import {
  openWeeks,
  reasonLabel,
  useMyCheckins,
  type CheckInDraft,
  useSemester,
} from "@/lib/checkin";
import { useI18n } from "@/lib/i18n";
import { weekPlan } from "@/lib/sessions";
import type {
  AttendanceSummary,
  CheckIn,
  Semester,
  Session,
  TutorProfile,
} from "@/lib/types";
import { studentNav } from "@/lib/nav";
import { formatDate, formatDayInTz, formatInTz } from "@/lib/time";

type Plan = ReturnType<typeof weekPlan>;

export function AttendanceView() {
  const { t, tv, locale } = useI18n();
  const { semester } = useSemester();
  const { data: me } = useApi<{
    tutor: TutorProfile | null;
    attendance: AttendanceSummary;
  }>("/api/me");
  const { rows: filed, loading, submit } = useMyCheckins();
  const { data: sessions } = useApi<Session[]>("/api/sessions");
  const tz = useDeviceTimezone("Asia/Damascus");
  const now = useNow();

  const [picked, setPicked] = useState<number | null>(null);
  const week = picked ?? semester?.currentWeek ?? 0;
  const thisWeek = filed.find((row) => row.week === week);
  const plan = weekPlan((sessions ?? []).filter((session) => session.week === week), now);
  const attendance = me?.attendance;
  const counted = !!attendance && attendance.totalSessions > 0;

  return (
    <AppShell
      nav={studentNav}
      title={t("checkin.title")}
      description={
        semester && me
          ? [tv(semester.name), me.tutor?.name].filter(Boolean).join(" · ")
          : t("common.loading")
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("student.rate")}
          value={counted ? `${attendance!.rate}%` : "—"}
          accent="var(--accent-cool)"
        />
        <StatCard
          label={t("student.attendedcount")}
          value={counted ? attendance!.attended : "—"}
          accent="var(--accent-mint)"
          delay={90}
        />
        <StatCard
          label={t("student.missedcount")}
          value={counted ? attendance!.missed : "—"}
          accent="var(--accent)"
          delay={180}
        />
      </div>

      <SectionCard
        title={t("checkin.form")}
        description={t("checkin.subtitlestudent")}
        action={
          thisWeek ? (
            <StatusPill tone="success">{t("checkin.filed")}</StatusPill>
          ) : (
            <StatusPill tone="warning">{t("checkin.notyet")}</StatusPill>
          )
        }
      >
        {!semester || !sessions ? (
          <Loading />
        ) : semester.currentWeek === 0 ? (
          <EmptyState
            message={`${t("checkin.notstarted")} ${formatDate(semester.start, locale)}`}
          />
        ) : (
          <>
            <Select
              label={t("checkin.week")}
              value={String(week)}
              onChange={(event) => setPicked(Number(event.target.value))}
              options={openWeeks(semester).map((entry) => ({
                value: String(entry.week),
                label: `${t("common.week")} ${entry.week} · ${formatDate(entry.start, locale)} – ${formatDate(entry.end, locale)}`,
              }))}
              wrapperClassName="sm:max-w-[26rem]"
            />

            {thisWeek ? (
              <FiledReport row={thisWeek} semester={semester} />
            ) : plan.opensAt ? (
              <p className="mt-5 rounded-2xl border border-dashed border-line px-5 py-6 text-center text-[13px] leading-relaxed text-fg-subtle">
                {t("sched.formwaits")} {formatDayInTz(plan.opensAt, tz, locale)} ·{" "}
                {formatInTz(plan.opensAt, tz, locale)}
              </p>
            ) : (
              <WeekForm
                key={week}
                week={week}
                plan={plan}
                semester={semester}
                onSubmit={submit}
              />
            )}
          </>
        )}
      </SectionCard>

      <SectionCard title={t("checkin.history")} delay={80}>
        {loading ? (
          <Loading />
        ) : filed.length === 0 ? (
          <EmptyState message={t("common.empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {filed.map((row) => {
              const reason = reasonLabel(semester, row.reason);
              return (
                <Row key={row.id}>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold text-fg">
                      {t("common.week")} {row.week}
                    </p>
                    <p className="truncate text-[11.5px] text-fg-subtle">
                      {row.held
                        ? `${row.minutes} ${t("lesson.min")}`
                        : reason
                          ? tv(reason)
                          : t("checkin.nosession")}
                    </p>
                  </div>
                  <StatusPill tone={row.held ? "success" : "danger"}>
                    {row.held ? t("checkin.held") : t("checkin.nosession")}
                  </StatusPill>
                </Row>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </AppShell>
  );
}

function FiledReport({ row, semester }: { row: CheckIn; semester: Semester }) {
  const { t, tv } = useI18n();
  const reason = reasonLabel(semester, row.reason);

  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="row flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold text-fg">
            {row.held
              ? `${row.minutes} ${t("lesson.min")}`
              : reason
                ? tv(reason)
                : t("checkin.nosession")}
          </p>
          {row.note && (
            <p className="mt-1 text-[12.5px] leading-relaxed whitespace-pre-line text-fg-muted">
              {row.note}
            </p>
          )}
        </div>
        <StatusPill tone={row.held ? "success" : "danger"}>
          {row.held ? t("checkin.held") : t("checkin.nosession")}
        </StatusPill>
      </div>
      <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-fg-subtle">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {t("checkin.locked")}
      </p>
    </div>
  );
}

function WeekForm({
  week,
  plan,
  semester,
  onSubmit,
}: {
  week: number;
  plan: Plan;
  semester: Semester;
  onSubmit: (draft: CheckInDraft) => Promise<void>;
}) {
  const { t, tv } = useI18n();
  const toast = useToast();

  const planned = plan.scheduled > 0;
  const [held, setHeld] = useState(planned ? plan.held : true);
  const [minutes, setMinutes] = useState(String(planned && plan.held ? plan.minutes : 60));
  const [reason, setReason] = useState(semester.absenceReasons[0].value);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mt-5 flex flex-col gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
          await onSubmit({
            week,
            held,
            minutes: held ? Number(minutes) : null,
            reason: held ? null : reason,
            note: note.trim() || null,
          });
          toast.success(t("checkin.sent"));
        } catch (cause) {
          const message = (cause as Error).message;
          toast.info(message === "locked" ? t("checkin.locked") : message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {planned && (
        <p className="rounded-2xl border border-line bg-tint px-4 py-3 text-[12.5px] leading-relaxed text-fg-muted">
          {t("sched.prefilled")}
        </p>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] font-semibold text-fg">
          {t("checkin.happenedstudent")}
        </legend>
        <div className="mt-1 flex gap-6">
          {[
            { value: true, label: t("common.yes") },
            { value: false, label: t("common.no") },
          ].map((option) => (
            <label
              key={String(option.value)}
              className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-fg"
            >
              <Radio
                name={`held-${week}`}
                checked={held === option.value}
                onChange={() => setHeld(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {held ? (
        <Input
          label={t("checkin.minutes")}
          type="number"
          min={1}
          max={300}
          required
          dir="ltr"
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          wrapperClassName="sm:max-w-[14rem]"
        />
      ) : (
        <Select
          label={t("checkin.reason")}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          options={semester.absenceReasons.map((entry) => ({
            value: entry.value,
            label: tv(entry.label),
          }))}
        />
      )}

      <Textarea
        label={t("common.notes")}
        placeholder={t("common.optional")}
        className="min-h-24"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />

      <Button type="submit" className="self-start" disabled={busy}>
        <CalendarCheck className="h-4 w-4" />
        {t("checkin.send")}
      </Button>
    </form>
  );
}
