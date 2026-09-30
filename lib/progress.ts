"use client";

import { useCallback, useEffect, useMemo } from "react";

import { send, useApi } from "@/lib/api";
import en from "@/messages/en/course.json";
import {
  PASS_MARK,
  quizPoints,
  readyUnits,
  requiredBlocks,
  units,
  unitsBySlug,
  type Block,
  type Unit,
} from "@/lib/training";

export type QuizResult = {
  score: number;
  total: number;
  passed: boolean;
  attempts: number;
  at: string;
  answers: Record<string, string>;
};

export type ExamSubmission = {
  at: string;
  answers: Record<string, string | string[]>;
};

export type Signature = {
  at: string;
  name: string;
};

export type UnitProgress = {
  done: string[];
  quizzes: Record<string, QuizResult>;
  exams?: Record<string, ExamSubmission>;
  agreements?: Record<string, Signature>;
  completedAt?: string;
};

export type Progress = {
  units: Record<string, UnitProgress>;
  submittedAt?: string;
  reference?: string;
};

export type UnitState = "locked" | "available" | "in_progress" | "completed" | "draft";

const EMPTY: Progress = { units: {} };

let latest: Progress = EMPTY;

function current(): Progress {
  return latest;
}

function commit(next: Progress) {
  latest = next;
  void send("/api/training-progress", "PUT", next);
}

function unitEntry(progress: Progress, slug: string): UnitProgress {
  return progress.units[slug] ?? { done: [], quizzes: {} };
}

// Quizzes and exams are single-attempt, so answering once clears the block. Gating on a
// pass instead would strand a student who fails their only try, with no way to finish the
// unit or send their training; the score still travels to admissions in the report.
export function blockCleared(
  progress: Progress,
  slug: string,
  block: Extract<Block, { id: string }>,
): boolean {
  const entry = unitEntry(progress, slug);
  if (block.kind === "quiz") return !!entry.quizzes[block.id];
  if (block.kind === "exam") return !!entry.exams?.[block.id];
  if (block.kind === "agreement") return !!entry.agreements?.[block.id];
  return entry.done.includes(block.id);
}

export function unitRequirementsMet(progress: Progress, unit: Unit): boolean {
  return requiredBlocks(unit).every((block) => blockCleared(progress, unit.slug, block));
}

export function unitStateOf(progress: Progress, unit: Unit): UnitState {
  if (unit.draft) return "draft";
  if (progress.units[unit.slug]?.completedAt) return "completed";

  const index = units.findIndex((u) => u.slug === unit.slug);
  const previous = index > 0 ? units[index - 1] : undefined;
  if (previous && !progress.units[previous.slug]?.completedAt) return "locked";

  const entry = progress.units[unit.slug];
  const started =
    !!entry && (entry.done.length > 0 || Object.keys(entry.quizzes).length > 0);
  return started ? "in_progress" : "available";
}

export function gradeQuiz(
  questions: Parameters<typeof quizPoints>[0],
  answers: Record<string, string>,
  previousAttempts = 0,
): QuizResult {
  let score = 0;

  for (const question of questions) {
    if (question.kind === "grid") {
      for (const row of question.rows) {
        if (answers[row.id] === row.answer) score += 1;
      }
    } else if (question.kind === "choice") {
      if (answers[question.id] === question.answer) score += 1;
    } else {
      const given = (answers[question.id] ?? "").trim().toLowerCase();
      if (question.accept.some((accepted) => accepted.toLowerCase() === given)) score += 1;
    }
  }

  const total = quizPoints(questions);
  return {
    score,
    total,
    passed: total > 0 && score / total >= PASS_MARK,
    attempts: previousAttempts + 1,
    at: new Date().toISOString(),
    answers,
  };
}

export function useProgress() {
  const { data } = useApi<Progress>("/api/training-progress");
  const hydrated = data !== undefined;
  const progress = useMemo(() => data ?? EMPTY, [data]);

  useEffect(() => {
    latest = progress;
  }, [progress]);

  const setBlockDone = useCallback((slug: string, blockId: string, done: boolean) => {
    const next = current();
    const entry = unitEntry(next, slug);
    const cleared = new Set(entry.done);
    if (done) cleared.add(blockId);
    else cleared.delete(blockId);
    commit({
      ...next,
      units: { ...next.units, [slug]: { ...entry, done: [...cleared] } },
    });
  }, []);

  const saveQuiz = useCallback((slug: string, quizId: string, result: QuizResult) => {
    const next = current();
    const entry = unitEntry(next, slug);
    if (entry.quizzes[quizId]) return;
    commit({
      ...next,
      units: {
        ...next.units,
        [slug]: { ...entry, quizzes: { ...entry.quizzes, [quizId]: result } },
      },
    });
  }, []);

  const saveExam = useCallback(
    (slug: string, examId: string, answers: Record<string, string | string[]>) => {
      const next = current();
      const entry = unitEntry(next, slug);
      if (entry.exams?.[examId]) return;
      commit({
        ...next,
        units: {
          ...next.units,
          [slug]: {
            ...entry,
            exams: {
              ...entry.exams,
              [examId]: { at: new Date().toISOString(), answers },
            },
          },
        },
      });
    },
    [],
  );

  const signAgreement = useCallback((slug: string, agreementId: string, name: string) => {
    const next = current();
    const entry = unitEntry(next, slug);
    if (entry.agreements?.[agreementId]) return;
    commit({
      ...next,
      units: {
        ...next.units,
        [slug]: {
          ...entry,
          agreements: {
            ...entry.agreements,
            [agreementId]: { at: new Date().toISOString(), name },
          },
        },
      },
    });
  }, []);

  const completeUnit = useCallback((slug: string) => {
    const next = current();
    const entry = unitEntry(next, slug);
    if (entry.completedAt) return;
    commit({
      ...next,
      units: {
        ...next.units,
        [slug]: { ...entry, completedAt: new Date().toISOString() },
      },
    });
  }, []);

  const resetAll = useCallback(() => commit(EMPTY), []);

  const submit = useCallback(() => {
    const next = current();
    if (next.submittedAt) return next.reference!;
    const reference = `PA-TRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    commit({ ...next, submittedAt: new Date().toISOString(), reference });
    return reference;
  }, []);

  const summary = useMemo(() => {
    const completed = readyUnits.filter(
      (unit) => progress.units[unit.slug]?.completedAt,
    ).length;

    let score = 0;
    let total = 0;
    for (const unit of readyUnits) {
      for (const result of Object.values(progress.units[unit.slug]?.quizzes ?? {})) {
        score += result.score;
        total += result.total;
      }
    }

    return {
      completed,
      ready: readyUnits.length,
      all: units.length,
      readyDone: completed === readyUnits.length,
      score,
      total,
      submittedAt: progress.submittedAt,
      reference: progress.reference,
    };
  }, [progress]);

  return {
    hydrated,
    progress,
    summary,
    stateOf: (unit: Unit) => unitStateOf(progress, unit),
    isDone: (slug: string, blockId: string) =>
      unitEntry(progress, slug).done.includes(blockId),
    quizResult: (slug: string, quizId: string) =>
      unitEntry(progress, slug).quizzes[quizId],
    examSubmission: (slug: string, examId: string) =>
      unitEntry(progress, slug).exams?.[examId],
    signature: (slug: string, agreementId: string) =>
      unitEntry(progress, slug).agreements?.[agreementId],
    requirementsMet: (unit: Unit) => unitRequirementsMet(progress, unit),
    isCleared: (slug: string, block: Extract<Block, { id: string }>) =>
      blockCleared(progress, slug, block),
    setBlockDone,
    saveQuiz,
    saveExam,
    signAgreement,
    completeUnit,
    submit,
    resetAll,
  };
}

function englishCourse(key: string): string {
  let node: unknown = en;
  for (const part of key.replace(/^course./, "").split(".")) {
    if (typeof node !== "object" || node === null) return key;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : key;
}

export function buildReport(
  progress: Progress,
  student: { id: string; name: string; email: string },
) {
  return {
    reference: progress.reference,
    submittedAt: progress.submittedAt,
    student,
    units: readyUnits.map((unit) => {
      const entry = unitEntry(progress, unit.slug);
      return {
        slug: unit.slug,
        order: unit.order,
        title: englishCourse(unit.title),
        completedAt: entry.completedAt ?? null,
        quizzes: Object.entries(entry.quizzes).map(([quizId, result]) => ({
          quizId,
          score: result.score,
          total: result.total,
          passed: result.passed,
          attempts: result.attempts,
          at: result.at,
          answers: result.answers,
        })),
        exams: Object.entries(entry.exams ?? {}).map(([examId, submission]) => ({
          examId,
          at: submission.at,
          answers: submission.answers,
        })),
        agreements: Object.entries(entry.agreements ?? {}).map(([id, signature]) => ({
          agreementId: id,
          at: signature.at,
          name: signature.name,
        })),
      };
    }),
  };
}

export { unitsBySlug };
