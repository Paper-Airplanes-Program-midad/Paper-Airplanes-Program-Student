"use client";

import { BookMarked, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/portal/app-shell";
import {
  EmptyState,
  Row,
  SectionCard,
  StatCard,
  StatusPill,
} from "@/components/portal/kit";
import { Button, Input, Progress, useToast } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { studentNav } from "@/lib/nav";
import { quizQueue, useVocab, vocabStats } from "@/lib/vocab";

export function VocabView() {
  const { t } = useI18n();
  const toast = useToast();
  const { words, hydrated, addWord, removeWord, review } = useVocab();

  const [term, setTerm] = useState("");
  const [translation, setTranslation] = useState("");
  const [query, setQuery] = useState("");
  const [quizOn, setQuizOn] = useState(false);
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [queue, setQueue] = useState<string[]>([]);

  const stats = vocabStats(words);
  const filtered = useMemo(
    () =>
      words.filter((word) =>
        `${word.term} ${word.translation}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [words, query],
  );

  const startQuiz = () => {
    const ids = quizQueue(words)
      .slice(0, 10)
      .map((word) => word.id);
    if (!ids.length) {
      toast.info(t("vocab.needwords"));
      return;
    }
    setQueue(ids);
    setStep(0);
    setCorrect(0);
    setRevealed(false);
    setQuizOn(true);
  };

  const current = words.find((word) => word.id === queue[step]);

  const answer = (known: boolean) => {
    if (current) review(current.id, known);
    if (known) setCorrect((c) => c + 1);
    setRevealed(false);
    setStep((s) => s + 1);
  };

  const submitAdd = async () => {
    const saved = await addWord({ term, translation, source: t("vocab.added") });
    if (!saved) {
      toast.info(t("vocab.duplicate"));
      return;
    }
    toast.success(t("vocab.saved"));
    setTerm("");
    setTranslation("");
  };

  return (
    <AppShell nav={studentNav} title={t("vocab.title")} description={t("vocab.subtitle")}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("vocab.total")}
          value={stats.total}
          icon={BookMarked}
          accent="var(--accent-cool)"
        />
        <StatCard
          label={t("vocab.mastered")}
          value={`${stats.masteredPct}%`}
          icon={Sparkles}
          accent="var(--accent-mint)"
          delay={80}
        />
        <StatCard
          label={t("vocab.learningcount")}
          value={stats.learning}
          icon={RotateCcw}
          accent="var(--accent-iris)"
          delay={160}
        />
        <StatCard
          label={t("vocab.fresh")}
          value={stats.fresh}
          icon={Plus}
          accent="var(--accent)"
          delay={240}
        />
      </div>

      <SectionCard title={t("vocab.add")} description={t("vocab.adddesc")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            wrapperClassName="flex-1"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("vocab.word")}
            dir="ltr"
          />
          <Input
            wrapperClassName="flex-1"
            value={translation}
            onChange={(event) => setTranslation(event.target.value)}
            placeholder={t("vocab.translation")}
            dir="rtl"
          />
          <Button onClick={submitAdd} disabled={!term.trim()}>
            <Plus className="h-4 w-4" />
            {t("vocab.save")}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title={t("vocab.quiz")}
        description={t("vocab.quizdesc")}
        delay={80}
        action={
          quizOn ? null : (
            <Button size="sm" onClick={startQuiz}>
              {t("vocab.startquiz")}
            </Button>
          )
        }
      >
        {!quizOn ? (
          <p className="text-[13px] text-fg-muted">{t("vocab.quizidle")}</p>
        ) : step >= queue.length || !current ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-3xl font-extrabold tracking-[-0.02em] text-fg tabular-nums">
              {correct} / {queue.length}
            </p>
            <p className="text-[13px] text-fg-muted">{t("vocab.quizdone")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => setQuizOn(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={startQuiz}>{t("vocab.startquiz")}</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Progress value={(step / queue.length) * 100} accent="var(--accent-cool)" />
            <div className="grid min-h-40 place-items-center rounded-3xl border border-line bg-tint p-8 text-center">
              <div>
                <p className="text-3xl font-extrabold tracking-[-0.02em] text-fg" dir="ltr">
                  {current.term}
                </p>
                {revealed ? (
                  <div className="mt-3 flex flex-col gap-1">
                    <p className="text-xl font-bold text-accent-cool" dir="rtl">
                      {current.translation || "—"}
                    </p>
                    {current.context && (
                      <p className="text-[13px] text-fg-muted" dir="ltr">
                        {current.context}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-[13px] text-fg-subtle tabular-nums">
                    {step + 1} / {queue.length}
                  </p>
                )}
              </div>
            </div>
            {revealed ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="secondary" onClick={() => answer(false)}>
                  {t("vocab.again")}
                </Button>
                <Button onClick={() => answer(true)}>{t("vocab.good")}</Button>
              </div>
            ) : (
              <Button onClick={() => setRevealed(true)}>{t("vocab.reveal")}</Button>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={t("vocab.mycards")}
        description={t("vocab.mycardsdesc")}
        delay={140}
        action={
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("common.search")}
            className="h-9 w-36 sm:w-44"
          />
        }
      >
        {!hydrated ? (
          <p className="text-[13px] text-fg-subtle">{t("common.loading")}</p>
        ) : filtered.length === 0 ? (
          <EmptyState message={t("common.empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((word) => (
              <Row key={word.id}>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold text-fg">
                    {word.term}
                    {word.translation ? ` · ${word.translation}` : ""}
                  </p>
                  <p className="truncate text-[11.5px] text-fg-subtle">
                    {word.context || word.source}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusPill
                    tone={word.box >= 4 ? "success" : word.box > 1 ? "info" : "warning"}
                  >
                    {t("vocab.box")} {word.box}
                  </StatusPill>
                  <button
                    type="button"
                    aria-label={t("vocab.remove")}
                    onClick={() => removeWord(word.id)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-line bg-tint text-fg-faint transition-colors hover:border-red-500/40 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Row>
            ))}
          </ul>
        )}
      </SectionCard>
    </AppShell>
  );
}
