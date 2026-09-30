"use client";

import { CheckCircle2, ExternalLink, FileText, Send } from "lucide-react";
import { useMemo, useState } from "react";

import { StatusPill } from "@/components/portal/kit";
import { ArrowRight, Button, Checkbox, Input, Radio, Textarea, cn, useToast } from "@/components/ui";
import { examQuestions, type Exam, type ExamQuestion } from "@/lib/exam";
import { useI18n } from "@/lib/i18n";
import type { ExamSubmission } from "@/lib/progress";
import { formatDate } from "@/lib/time";

type Answers = Record<string, string | string[]>;

function isAnswered(question: ExamQuestion, answers: Answers): boolean {
  const value = answers[question.id];
  if (question.kind === "multi") return Array.isArray(value) && value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

export function ExamBlock({
  exam,
  submission,
  onSubmit,
}: {
  exam: Exam;
  submission?: ExamSubmission;
  onSubmit: (answers: Answers) => void;
}) {
  const { t, locale } = useI18n();
  const toast = useToast();

  const questions = useMemo(() => examQuestions(exam), [exam]);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);

  const answered = questions.filter((question) => isAnswered(question, answers)).length;
  const complete = answered === questions.length;
  const part = exam.parts[step]!;
  const last = step === exam.parts.length - 1;

  const set = (id: string, value: string | string[]) =>
    setAnswers((current) => ({ ...current, [id]: value }));

  const toggle = (id: string, choiceId: string) =>
    setAnswers((current) => {
      const list = Array.isArray(current[id]) ? (current[id] as string[]) : [];
      return {
        ...current,
        [id]: list.includes(choiceId)
          ? list.filter((x) => x !== choiceId)
          : [...list, choiceId],
      };
    });

  if (submission) {
    return (
      <section className="rounded-3xl border border-line bg-tint p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-mint-500 to-mint-400 text-ink-950">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h4 className="text-[15px] font-extrabold text-fg">{t("exam.done")}</h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
              {t("exam.donedesc")}
            </p>
            <p className="mt-3 text-[12px] text-fg-subtle">
              {t("exam.oncenote")} · {formatDate(submission.at, locale)}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-tint">
      <header className="border-b border-line p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-[15px] font-extrabold text-fg">{t(exam.title)}</h4>
            <p className="mt-1 text-[11.5px] text-fg-faint">
              {questions.length} {t("exam.questions")} · {t("training.estimate")}{" "}
              {exam.minutes} min
            </p>
          </div>
          <StatusPill tone={complete ? "success" : "info"}>
            {answered}/{questions.length} {t("training.answered")}
          </StatusPill>
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-fg-muted">{t(exam.intro)}</p>

        <ol className="mt-4 flex flex-wrap gap-2">
          {exam.parts.map((item, index) => {
            const done = item.groups
              .flatMap((group) => group.questions)
              .every((question) => isAnswered(question, answers));
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setStep(index)}
                  aria-current={index === step ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors",
                    index === step
                      ? "border-transparent bg-tint-2 text-fg ring-2 ring-dawn-400"
                      : "border-line bg-card text-fg-muted hover:border-line-strong",
                  )}
                >
                  {done && <CheckCircle2 className="h-3.5 w-3.5 text-accent-mint" />}
                  {item.label}
                </button>
              </li>
            );
          })}
        </ol>
      </header>

      <div className="flex flex-col gap-5 p-5">
        <div>
          <h5 className="text-[14px] font-extrabold text-fg">
            {part.label} — {t(part.title)}
          </h5>
          <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{t(part.intro)}</p>
        </div>

        {part.passage && (
          <article className="rounded-2xl border border-line bg-card" dir="ltr">
            <header className="flex items-start gap-3 border-b border-line p-4">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent-cool" />
              <div className="min-w-0">
                <p className="text-[13.5px] font-extrabold text-fg">{part.passage.title}</p>
                <p className="text-[12px] text-fg-subtle">{part.passage.author}</p>
              </div>
            </header>
            <div className="max-h-[26rem] overflow-y-auto p-4">
              {part.passage.body.map((paragraph, index) => (
                <p
                  key={index}
                  className="mb-3 text-[13.5px] leading-[1.9] whitespace-pre-line text-fg-muted last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        )}

        {part.video && (
          <div className="rounded-2xl border border-line bg-card p-4">
            <p className="text-[13.5px] font-extrabold text-fg">{part.video.title}</p>
            <div className="mt-3 overflow-hidden rounded-xl border border-line">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${part.video.youtubeId}`}
                title={part.video.title}
                allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full"
              />
            </div>
            <a
              href={part.video.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-accent-cool hover:underline"
              dir="ltr"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {part.video.url}
            </a>
          </div>
        )}

        {part.groups.map((group) => (
          <div key={group.id}>
            <div className="rounded-2xl border border-line bg-card px-4 py-3">
              <p className="text-[13.5px] font-extrabold text-fg" dir="ltr">
                {group.title}
              </p>
              {group.note && (
                <p className="mt-1 text-[12.5px] text-fg-muted" dir="ltr">
                  {group.note}
                </p>
              )}
            </div>

            <ol className="mt-3 flex flex-col gap-3">
              {group.questions.map((question) => (
                <li
                  key={question.id}
                  className="rounded-2xl border border-line bg-card p-4"
                  dir="ltr"
                >
                  <p className="text-[13.5px] leading-relaxed font-semibold text-fg">
                    <span className="text-fg-faint tabular-nums">
                      {question.label ?? question.n}.{" "}
                    </span>
                    {question.prompt}
                  </p>

                  {question.kind === "choice" && (
                    <div className="mt-3 flex flex-col gap-2">
                      {question.choices.map((option) => {
                        const checked = answers[question.id] === option.id;
                        return (
                          <label
                            key={option.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-[13px] leading-relaxed transition-colors",
                              checked
                                ? "border-transparent bg-tint-2 text-fg ring-2 ring-dawn-400"
                                : "border-line bg-tint text-fg-muted hover:border-line-strong",
                            )}
                          >
                            <Radio
                              name={question.id}
                              checked={checked}
                              onChange={() => set(question.id, option.id)}
                            />
                            <span className="min-w-0">{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {question.kind === "multi" && (
                    <div className="mt-3 flex flex-col gap-2">
                      {question.choices.map((option) => {
                        const list = Array.isArray(answers[question.id])
                          ? (answers[question.id] as string[])
                          : [];
                        const checked = list.includes(option.id);
                        return (
                          <label
                            key={option.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-[13px] leading-relaxed transition-colors",
                              checked
                                ? "border-transparent bg-tint-2 text-fg ring-2 ring-dawn-400"
                                : "border-line bg-tint text-fg-muted hover:border-line-strong",
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onChange={() => toggle(question.id, option.id)}
                            />
                            <span className="min-w-0">{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {question.kind === "short" && (
                    <Input
                      className="mt-3"
                      value={(answers[question.id] as string) ?? ""}
                      onChange={(event) => set(question.id, event.target.value)}
                    />
                  )}

                  {question.kind === "long" && (
                    <Textarea
                      className="mt-3 min-h-32"
                      value={(answers[question.id] as string) ?? ""}
                      onChange={(event) => set(question.id, event.target.value)}
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-line p-5">
        <Button
          variant="secondary"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          {t("exam.back")}
        </Button>

        {last ? (
          <Button
            disabled={!complete}
            onClick={() => {
              onSubmit(answers);
              toast.success(t("exam.sent"));
            }}
          >
            <Send className="h-4 w-4" />
            {t("exam.submit")}
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => s + 1)}>
            {t("exam.next")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        )}

        <span className="text-[12px] text-fg-subtle">
          {complete ? t("exam.readytosend") : t("exam.answerall")}
        </span>
      </footer>
    </section>
  );
}
