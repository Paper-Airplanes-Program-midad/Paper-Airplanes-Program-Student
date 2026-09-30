"use client";

import { CheckCircle2, ClipboardCheck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { StatusPill } from "@/components/portal/kit";
import { Button, Input, Radio, cn, useToast } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { gradeQuiz, type QuizResult } from "@/lib/progress";
import {
  PASS_MARK,
  questionPoints,
  quizPoints,
  type QuizBlock as Quiz,
  type Question,
} from "@/lib/training";

type Answers = Record<string, string>;

function answerSlots(questions: Question[]): string[] {
  return questions.flatMap((question) =>
    question.kind === "grid" ? question.rows.map((row) => row.id) : [question.id],
  );
}

function OptionRow({
  name,
  checked,
  onSelect,
  label,
  tone,
  disabled,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
  tone?: "correct" | "wrong";
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-[13.5px] leading-relaxed transition-colors",
        disabled && "cursor-default",
        tone === "correct"
          ? "border-mint-500/45 bg-mint-500/10 text-fg"
          : tone === "wrong"
            ? "border-red-500/45 bg-red-500/8 text-fg"
            : checked
              ? "border-transparent bg-tint-2 text-fg ring-2 ring-dawn-400"
              : "border-line bg-tint text-fg-muted hover:border-line-strong",
      )}
    >
      <Radio name={name} checked={checked} onChange={onSelect} disabled={disabled} />
      <span className="min-w-0">{label}</span>
    </label>
  );
}

export function QuizBlock({
  block,
  stored,
  onGraded,
}: {
  block: Quiz;
  stored?: QuizResult;
  onGraded: (result: QuizResult) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();

  const total = useMemo(() => quizPoints(block.questions), [block.questions]);
  const slots = useMemo(() => answerSlots(block.questions), [block.questions]);

  const [answers, setAnswers] = useState<Answers>(stored?.answers ?? {});
  const [fresh, setFresh] = useState<QuizResult | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const result = fresh ?? stored;
  const settled = !!result;
  const answered = slots.filter((slot) => answers[slot]).length;

  const set = (slot: string, value: string) =>
    setAnswers((current) => ({ ...current, [slot]: value }));

  const submit = () => {
    const graded = gradeQuiz(block.questions, answers, stored?.attempts ?? 0);
    setFresh(graded);
    setReviewing(true);
    onGraded(graded);
    if (graded.passed) toast.success(t("training.quizpassed"));
    else toast.info(t("training.quizfailed"));
  };

  if (settled) {
    const pct = Math.round((result.score / total) * 100);
    return (
      <section className="relative overflow-hidden rounded-3xl border border-line bg-tint p-5">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-transparent",
                result.passed
                  ? "bg-gradient-to-br from-mint-500 to-mint-400 text-ink-950"
                  : "bg-red-500/15 text-red-500",
              )}
            >
              {result.passed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <h4 className="text-[14px] font-extrabold text-fg">{t(block.title)}</h4>
              <p className="mt-1 text-[12.5px] text-fg-muted">
                {result.passed ? t("training.quizpassed") : t("training.quizfailed")} ·{" "}
                {t("training.attempt")} {result.attempts}
              </p>
            </div>
          </div>
          <div className="text-end">
            <p className="text-2xl leading-none font-extrabold tracking-[-0.02em] text-fg tabular-nums">
              {result.score}
              <span className="text-fg-faint">/{total}</span>
            </p>
            <p className="mt-1 text-[11.5px] text-fg-subtle tabular-nums">{pct}%</p>
          </div>
        </header>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <Button size="sm" variant="secondary" onClick={() => setReviewing((v) => !v)}>
            {reviewing ? t("training.hideanswers") : t("training.reviewanswers")}
          </Button>
          <span className="text-[12px] text-fg-subtle">
            {t("training.oncenote")} · {t("training.passmark")}{" "}
            {Math.round(PASS_MARK * 100)}%
          </span>
        </div>

        {reviewing && (
          <ol className="mt-4 flex flex-col gap-4">
            {block.questions.map((question, index) => (
              <li key={question.id} className="rounded-2xl border border-line bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-[13.5px] leading-relaxed font-semibold text-fg">
                    <span className="text-fg-faint tabular-nums">{index + 1}. </span>
                    {t(question.prompt)}
                  </p>
                  <StatusPill tone="neutral">
                    {questionPoints(question)} {t("training.points")}
                  </StatusPill>
                </div>
                <div className="mt-3">
                  <QuestionReview question={question} answers={result.answers} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-tint p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-line bg-card text-accent-iris">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h4 className="text-[14px] font-extrabold text-fg">{t(block.title)}</h4>
            {block.note && <p className="mt-1 text-[12.5px] text-fg-muted">{t(block.note)}</p>}
            <p className="mt-1 text-[11.5px] text-fg-faint">
              {total} {t("training.points")} · {t("training.passmark")}{" "}
              {Math.round(PASS_MARK * 100)}%
            </p>
            <p className="mt-1 text-[11.5px] font-semibold text-fg-muted">
              {t("training.oncenote")}
            </p>
          </div>
        </div>
      </header>

      <ol className="mt-5 flex flex-col gap-5">
        {block.questions.map((question, index) => (
          <li key={question.id} className="rounded-2xl border border-line bg-card p-4">
            <p className="text-[13.5px] leading-relaxed font-semibold text-fg">
              <span className="text-fg-faint tabular-nums">{index + 1}. </span>
              {t(question.prompt)}
            </p>

            {question.kind === "text" && (
              <Input
                className="mt-3"
                dir="ltr"
                value={answers[question.id] ?? ""}
                placeholder={question.placeholder ? t(question.placeholder) : undefined}
                onChange={(event) => set(question.id, event.target.value)}
              />
            )}

            {question.kind === "choice" && (
              <div className="mt-3 flex flex-col gap-2">
                {question.choices.map((choice) => (
                  <OptionRow
                    key={choice.id}
                    name={question.id}
                    checked={answers[question.id] === choice.id}
                    onSelect={() => set(question.id, choice.id)}
                    label={t(choice.label)}
                  />
                ))}
              </div>
            )}

            {question.kind === "grid" && (
              <ul className="mt-3 flex flex-col gap-3">
                {question.rows.map((row) => (
                  <li key={row.id} className="rounded-2xl border border-line bg-tint p-3.5">
                    <p className="text-[13px] leading-relaxed text-fg">{t(row.label)}</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {question.columns.map((column) => {
                        const checked = answers[row.id] === column.id;
                        return (
                          <label
                            key={column.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                              checked
                                ? "border-transparent bg-tint-2 text-fg ring-2 ring-dawn-400"
                                : "border-line bg-card text-fg-muted hover:border-line-strong",
                            )}
                          >
                            <Radio
                              name={row.id}
                              checked={checked}
                              onChange={() => set(row.id, column.id)}
                              className="h-4 w-4"
                            />
                            {t(column.label)}
                          </label>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button onClick={submit} disabled={answered < slots.length}>
          {t("training.submitquiz")}
        </Button>
        <span className="text-[12px] text-fg-subtle tabular-nums">
          {answered}/{slots.length} {t("training.answered")}
        </span>
      </div>
    </section>
  );
}

function QuestionReview({
  question,
  answers,
}: {
  question: Question;
  answers: Record<string, string>;
}) {
  const { t } = useI18n();

  if (question.kind === "text") {
    const given = (answers[question.id] ?? "").trim();
    const correct = question.accept.some(
      (accepted) => accepted.toLowerCase() === given.toLowerCase(),
    );
    return (
      <div className="flex flex-col gap-2">
        <p
          dir="ltr"
          className={cn(
            "rounded-2xl border p-3 text-[13px]",
            correct
              ? "border-mint-500/45 bg-mint-500/10 text-fg"
              : "border-red-500/45 bg-red-500/8 text-fg",
          )}
        >
          {given || "—"}
        </p>
        {!correct && (
          <p className="text-[12.5px] text-fg-muted">
            {t("training.correctanswer")}:{" "}
            <span dir="ltr" className="font-semibold text-fg">
              {question.accept[0]}
            </span>
          </p>
        )}
      </div>
    );
  }

  if (question.kind === "choice") {
    return (
      <div className="flex flex-col gap-2">
        {question.choices.map((choice) => {
          const picked = answers[question.id] === choice.id;
          const isAnswer = question.answer === choice.id;
          return (
            <OptionRow
              key={choice.id}
              name={`${question.id}-review`}
              checked={picked}
              onSelect={() => {}}
              disabled
              label={t(choice.label)}
              tone={isAnswer ? "correct" : picked ? "wrong" : undefined}
            />
          );
        })}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {question.rows.map((row) => {
        const given = answers[row.id];
        const correct = given === row.answer;
        const label = (id: string) =>
          t(question.columns.find((column) => column.id === id)?.label ?? "—");
        return (
          <li
            key={row.id}
            className={cn(
              "rounded-2xl border p-3 text-[13px]",
              correct
                ? "border-mint-500/45 bg-mint-500/10"
                : "border-red-500/45 bg-red-500/8",
            )}
          >
            <p className="leading-relaxed text-fg">{t(row.label)}</p>
            <p className="mt-1.5 text-[12.5px] text-fg-muted">
              {t("training.youanswered")}:{" "}
              <span className="font-semibold text-fg">{given ? label(given) : "—"}</span>
              {!correct && (
                <>
                  {" · "}
                  {t("training.correctanswer")}:{" "}
                  <span className="font-semibold text-fg">{label(row.answer)}</span>
                </>
              )}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
