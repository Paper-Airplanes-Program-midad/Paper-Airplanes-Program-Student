"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Hammer, Lock } from "lucide-react";

import { AppShell } from "@/components/portal/app-shell";
import { Loading, SectionCard, StatusPill } from "@/components/portal/kit";
import {
  AgreementBlock,
  CardsBlock,
  Contacts,
  LinksBlock,
  Note,
  Prose,
  ReadBlock,
  Steps,
  WatchBlock,
} from "@/components/portal/training/blocks";
import { ExamBlock } from "@/components/portal/training/exam";
import { QuizBlock } from "@/components/portal/training/quiz";
import { ArrowRight, Button, Progress, Reveal, useToast } from "@/components/ui";
import { useAccess } from "@/lib/access";
import { useI18n, useMessages } from "@/lib/i18n";
import { studentNav } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { requiredBlocks, units, unitsBySlug } from "@/lib/training";

export function UnitView({ slug }: { slug: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const progress = useProgress();
  const { approved } = useAccess();
  const navLock = approved ? undefined : "/onboarding";

  const unit = unitsBySlug.get(slug)!;
  const hasExam = unit.sections.some((section) =>
    section.blocks.some((block) => block.kind === "exam"),
  );
  const courseReady = useMessages("course");
  const examReady = useMessages(hasExam ? "diagnostic" : null);
  const index = units.findIndex((u) => u.slug === slug);
  const next = units[index + 1];

  const state = progress.stateOf(unit);
  const required = requiredBlocks(unit);
  const cleared = required.filter((block) => progress.isCleared(slug, block)).length;
  const ready = progress.requirementsMet(unit);
  const completed = state === "completed";

  const header = (
    <AppShellHeader
      order={unit.order}
      title={t(unit.title)}
      minutes={unit.minutes}
      estimate={t("training.estimate")}
    />
  );

  if (!courseReady || !examReady) {
    return (
      <AppShell nav={studentNav} title={t("common.loading")} locked={navLock}>
        <Loading rows={5} />
      </AppShell>
    );
  }

  if (unit.draft || (progress.hydrated && state === "locked")) {
    const locked = state === "locked";
    return (
      <AppShell
        nav={studentNav}
        title={header}
        description={t(unit.summary)}
        locked={navLock}
      >
        <Reveal>
          <div className="panel flex flex-col items-center gap-4 p-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-tint text-fg-faint">
              {locked ? <Lock className="h-5 w-5" /> : <Hammer className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-[15px] font-extrabold text-fg">
                {locked ? t("training.locked") : t("training.soon")}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-fg-muted">
                {locked ? t("training.lockeddesc") : t("training.soondesc")}
              </p>
            </div>
            <Button variant="secondary" onClick={() => router.push("/onboarding")}>
              {t("training.backtolist")}
            </Button>
          </div>
        </Reveal>
      </AppShell>
    );
  }

  const finish = () => {
    progress.completeUnit(slug);
    toast.success(t("training.finished"));
    router.push(next && !next.draft ? `/onboarding/${next.slug}` : "/onboarding");
  };

  return (
    <AppShell
      nav={studentNav}
      locked={navLock}
      title={header}
      description={t(unit.summary)}
      actions={
        <Link
          href="/onboarding"
          className="hidden h-9 items-center rounded-full border border-line bg-tint px-3.5 text-[13px] font-semibold text-fg-muted transition-colors hover:text-fg sm:inline-flex"
        >
          {t("training.backtolist")}
        </Link>
      }
    >
      {required.length > 0 && (
        <Reveal>
          <div className="panel flex flex-wrap items-center gap-4 p-4">
            <StatusPill tone={completed ? "success" : ready ? "info" : "warning"}>
              {completed
                ? t("training.completed")
                : ready
                  ? t("training.finish")
                  : t("training.inprogress")}
            </StatusPill>
            <Progress
              value={(cleared / required.length) * 100}
              className="min-w-40 flex-1"
              accent={completed ? "var(--accent-mint)" : "var(--accent)"}
              label={t("training.progress")}
            />
            <span className="text-[12px] font-bold text-fg-muted tabular-nums">
              {cleared}/{required.length} {t("training.tasksdone")}
            </span>
          </div>
        </Reveal>
      )}

      {unit.sections.map((section, sectionIndex) => (
        <SectionCard
          key={section.id}
          title={section.title ? t(section.title) : t(unit.title)}
          delay={sectionIndex * 60}
        >
          <div className="flex flex-col gap-5">
            {section.blocks.map((block, blockIndex) => {
              switch (block.kind) {
                case "prose":
                  return <Prose key={blockIndex} body={t(block.body)} />;
                case "steps":
                  return (
                    <Steps
                      key={blockIndex}
                      ordered={block.ordered}
                      title={block.title ? t(block.title) : undefined}
                      items={block.items.map((item) => ({
                        text: t(item.text),
                        sub: item.sub?.map((line) => t(line)),
                      }))}
                    />
                  );
                case "note":
                  return (
                    <Note
                      key={blockIndex}
                      title={block.title ? t(block.title) : undefined}
                      body={t(block.body)}
                    />
                  );
                case "contacts":
                  return <Contacts key={blockIndex} items={block.items} />;
                case "links":
                  return <LinksBlock key={blockIndex} block={block} />;
                case "cards":
                  return <CardsBlock key={blockIndex} block={block} />;
                case "agreement":
                  return (
                    <AgreementBlock
                      key={block.id}
                      block={block}
                      signature={progress.signature(slug, block.id)}
                      onSign={(name) => progress.signAgreement(slug, block.id, name)}
                    />
                  );
                case "exam":
                  return (
                    <ExamBlock
                      key={block.id}
                      exam={block.exam}
                      submission={progress.examSubmission(slug, block.id)}
                      onSubmit={(answers) => progress.saveExam(slug, block.id, answers)}
                    />
                  );
                case "read":
                  return (
                    <ReadBlock
                      key={block.id}
                      block={block}
                      done={progress.isDone(slug, block.id)}
                      onDone={(done) => progress.setBlockDone(slug, block.id, done)}
                    />
                  );
                case "watch":
                  return (
                    <WatchBlock
                      key={block.id}
                      block={block}
                      done={progress.isDone(slug, block.id)}
                      onDone={(done) => progress.setBlockDone(slug, block.id, done)}
                    />
                  );
                case "quiz":
                  return (
                    <QuizBlock
                      key={block.id}
                      block={block}
                      stored={progress.quizResult(slug, block.id)}
                      onGraded={(result) => progress.saveQuiz(slug, block.id, result)}
                    />
                  );
              }
            })}
          </div>
        </SectionCard>
      ))}

      <Reveal delay={120}>
        <div className="panel flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-[14px] font-extrabold text-fg">
              {completed ? t("training.finished") : t("training.finish")}
            </p>
            <p className="mt-1 text-[12.5px] text-fg-muted">
              {completed ? t(unit.summary) : t("training.finishhint")}
            </p>
          </div>

          {completed ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 text-[13px] font-bold text-accent-mint">
                <CheckCircle2 className="h-4 w-4" />
                {t("training.completed")}
              </span>
              {next && !next.draft && (
                <Button onClick={() => router.push(`/onboarding/${next.slug}`)}>
                  {t("training.next")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              )}
            </div>
          ) : (
            <Button onClick={finish} disabled={!progress.hydrated || !ready}>
              {t("training.finish")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          )}
        </div>
      </Reveal>
    </AppShell>
  );
}

function AppShellHeader({
  order,
  title,
  minutes,
  estimate,
}: {
  order: number;
  title: string;
  minutes: number;
  estimate: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="shrink-0 rounded-full border border-line bg-tint px-2 py-0.5 text-[11px] font-extrabold text-accent-cool tabular-nums">
        {order}
      </span>
      <span className="truncate">{title}</span>
      <span className="hidden shrink-0 items-center gap-1 text-[11.5px] font-semibold text-fg-faint sm:inline-flex">
        <Clock className="h-3 w-3" />
        {estimate} {minutes} min
      </span>
    </span>
  );
}
