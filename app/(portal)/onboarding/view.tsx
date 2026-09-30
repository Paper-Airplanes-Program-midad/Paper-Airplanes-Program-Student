"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ShieldAlert,
  Hammer,
  Lock,
  Send,
  Sparkles,
  Trophy,
} from "lucide-react";

import { AppShell } from "@/components/portal/app-shell";
import {
  Loading,
  SectionCard,
  StatCard,
  StatusPill,
  type Tone,
} from "@/components/portal/kit";
import { ArrowRight, Button, Progress, Reveal, cn, useToast } from "@/components/ui";
import { submitApplication, useAccess } from "@/lib/access";
import { useApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n, useMessages } from "@/lib/i18n";
import { studentNav } from "@/lib/nav";
import { useProgress, type UnitState } from "@/lib/progress";
import { formatDate } from "@/lib/time";
import { readyUnits, requiredBlocks, units, unitQuizzes } from "@/lib/training";

const STATE_TONE: Record<UnitState, Tone> = {
  completed: "success",
  in_progress: "info",
  available: "accent",
  locked: "neutral",
  draft: "neutral",
};

const STATE_KEY: Record<UnitState, string> = {
  completed: "training.completed",
  in_progress: "training.inprogress",
  available: "training.available",
  locked: "training.locked",
  draft: "training.soon",
};

type Intake = { open: boolean; message: { en: string; ar: string } };

export function OnboardingView() {
  const { t, tv, locale } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const progress = useProgress();

  const { application, approved, refresh: refreshAccess } = useAccess();
  const { data: intake } = useApi<Intake>("/api/intake");
  const courseReady = useMessages("course");

  const intakeClosed = intake?.open === false;
  const intakeNote =
    (intake &&
      (tv(intake.message).trim() ||
        intake.message.ar.trim() ||
        intake.message.en.trim())) ||
    t("training.intakeclosed");

  const { summary } = progress;
  const pct = summary.ready ? Math.round((summary.completed / summary.ready) * 100) : 0;

  const waiting = application?.status === "pending";
  const rejected = application?.status === "rejected";
  const accepted = application?.status === "approved";

  if (!courseReady) {
    return (
      <AppShell
        nav={studentNav}
        title={`${t("student.welcome")}, ${user?.name.split(" ")[0] ?? ""}`}
        description={t("common.loading")}
      >
        <Loading rows={4} />
      </AppShell>
    );
  }

  return (
    <AppShell
      nav={studentNav}
      title={`${t("student.welcome")}, ${user?.name.split(" ")[0] ?? ""}`}
      description={approved ? t("student.application") : t("apply.subtitle")}
      locked={approved ? undefined : "/onboarding"}
    >
      {(waiting || rejected) && (
        <Reveal>
          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4",
              rejected ? "border-red-500/25 bg-red-500/8" : "border-line bg-tint",
            )}
          >
            {rejected ? (
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            ) : (
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-fg-muted" />
            )}
            <div className="min-w-0">
              <p className="text-[13.5px] font-extrabold text-fg">
                {t(rejected ? "apply.rejectedtitle" : "apply.pendingtitle")}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
                {rejected
                  ? (application?.reason ?? t("apply.rejectedbody"))
                  : t("apply.pendingbody")}
              </p>
              {application?.reference && (
                <p className="mt-1.5 text-[12px] text-fg-subtle">
                  {t("training.reference")}: {application.reference}
                </p>
              )}
            </div>
          </div>
        </Reveal>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={t("training.title")}
          value={`${summary.completed}/${summary.ready}`}
          hint={`${t("training.units")} · ${pct}%`}
          icon={Sparkles}
          accent="var(--accent-cool)"
        />
        <StatCard
          label={t("training.overallscore")}
          value={summary.total ? `${summary.score}/${summary.total}` : "—"}
          hint={t("training.points")}
          icon={Trophy}
          accent="var(--accent-mint)"
          delay={90}
        />
      </div>

      <SectionCard
        title={t("training.title")}
        description={t("training.subtitle")}
        action={<Progress value={pct} className="w-24" accent="var(--accent)" />}
      >
        <ol className="flex flex-col gap-3">
          {units.map((unit) => (
            <UnitRow
              key={unit.slug}
              unit={unit}
              state={progress.stateOf(unit)}
              cleared={
                requiredBlocks(unit).filter((block) =>
                  progress.isCleared(unit.slug, block),
                ).length
              }
            />
          ))}
        </ol>

        {units.length > readyUnits.length && (
          <p className="mt-4 text-[12px] text-fg-subtle">{t("training.remaining")}</p>
        )}
      </SectionCard>

      <Reveal delay={80}>
        {summary.submittedAt ? (
          <div
            className="rounded-3xl border border-line bg-tint p-6"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-mint-500 to-mint-400 text-ink-950">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold text-fg">{t("training.submitted")}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
                  {t("training.submitteddesc")}
                </p>
                <p className="mt-3 text-[12.5px] text-fg-subtle">
                  {t("training.reference")}:{" "}
                  <span dir="ltr" className="font-extrabold text-fg">
                    {summary.reference}
                  </span>
                  {" · "}
                  {formatDate(summary.submittedAt, locale)}
                </p>
              </div>
            </div>

            <ul className="mt-5 flex flex-col gap-2 border-t border-line pt-4">
              {readyUnits.map((unit) => {
                const quizzes = unitQuizzes(unit);
                const scored = quizzes
                  .map((quiz) => progress.quizResult(unit.slug, quiz.id))
                  .filter(Boolean);
                return (
                  <li
                    key={unit.slug}
                    className="flex items-center justify-between gap-3 text-[12.5px]"
                  >
                    <span className="min-w-0 truncate text-fg-muted">
                      {t("training.unit")} {unit.order} · {t(unit.title)}
                    </span>
                    <span className="shrink-0 font-bold text-fg tabular-nums">
                      {scored.length
                        ? scored
                            .map((result) => `${result!.score}/${result!.total}`)
                            .join(" · ")
                        : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : accepted ? (
          <div className="panel flex items-start gap-3 p-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-mint-500 to-mint-400 text-ink-950">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-extrabold text-fg">{t("apply.approvedtitle")}</p>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-fg-muted">
                {t("apply.approvedbody")}
              </p>
            </div>
          </div>
        ) : (
          <div className="panel flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-2xl border",
                  summary.readyDone && !intakeClosed
                    ? "border-transparent bg-gradient-to-br from-dawn-500 to-dawn-400 text-on-accent"
                    : "border-line bg-tint text-fg-faint",
                )}
              >
                {intakeClosed ? <Lock className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold text-fg">{t("training.submittitle")}</p>
                <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-fg-muted">
                  {intakeClosed
                    ? t("training.intakeclosedtitle")
                    : summary.readyDone
                      ? t("training.submitdesc")
                      : t("training.blocked")}
                </p>
                {intakeClosed && (
                  <p className="mt-3 max-w-xl rounded-2xl border border-line bg-tint px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line text-fg">
                    {intakeNote}
                  </p>
                )}
              </div>
            </div>
            <Button
              disabled={!summary.readyDone || waiting || intakeClosed}
              onClick={async () => {
                const result = await submitApplication();
                if (result.ok) {
                  progress.submit();
                  refreshAccess();
                  toast.success(t("apply.sent"));
                  return;
                }
                toast.info(
                  result.error === "intake_closed"
                    ? intakeNote
                    : result.error === "already_sent"
                      ? t("apply.pendingbody")
                      : result.error === "already_approved"
                        ? t("apply.approvedbody")
                        : t("training.blocked"),
                );
              }}
            >
              {t("training.submitcta")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        )}
      </Reveal>

    </AppShell>
  );
}

function UnitRow({
  unit,
  state,
  cleared,
}: {
  unit: (typeof units)[number];
  state: UnitState;
  cleared: number;
}) {
  const { t } = useI18n();
  const required = requiredBlocks(unit).length;
  const openable = state !== "locked" && state !== "draft";

  const body = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-[13px] font-extrabold tabular-nums",
            state === "completed"
              ? "border-transparent bg-gradient-to-br from-mint-500 to-mint-400 text-ink-950"
              : "border-line bg-tint text-fg-muted",
          )}
        >
          {state === "completed" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : state === "locked" ? (
            <Lock className="h-3.5 w-3.5 text-fg-faint" />
          ) : state === "draft" ? (
            <Hammer className="h-3.5 w-3.5 text-fg-faint" />
          ) : (
            unit.order
          )}
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-[13.5px] font-bold",
              openable ? "text-fg" : "text-fg-subtle",
            )}
          >
            {t(unit.title)}
          </p>
          <p className="truncate text-[11.5px] text-fg-subtle">
            <Clock className="me-1 inline h-3 w-3 align-[-1px]" />
            {t("training.estimate")} {unit.minutes} min
            {required > 0 && (
              <>
                {" · "}
                <span className="tabular-nums">
                  {cleared}/{required}
                </span>{" "}
                {t("training.tasksdone")}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StatusPill tone={STATE_TONE[state]}>{t(STATE_KEY[state])}</StatusPill>
        {openable && (
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-[13px] font-semibold text-fg transition-colors group-hover:border-line-strong">
            {state === "completed"
              ? t("training.review")
              : state === "in_progress"
                ? t("training.continue")
                : t("training.start")}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </span>
        )}
      </div>
    </>
  );

  if (!openable) {
    return (
      <li className="row flex items-center justify-between gap-3 p-4 opacity-70">{body}</li>
    );
  }

  return (
    <li>
      <Link
        href={`/onboarding/${unit.slug}`}
        className="row group flex items-center justify-between gap-3 p-4 transition-colors hover:border-line-strong"
      >
        {body}
      </Link>
    </li>
  );
}
