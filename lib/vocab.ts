"use client";

import { useCallback, useMemo } from "react";

import { send, useApi } from "@/lib/api";
import type { VocabWord } from "@/lib/types";

export type { VocabWord };

export function useVocab() {
  const { data, refresh } = useApi<VocabWord[]>("/api/vocab");
  const words = useMemo(() => data ?? [], [data]);

  const addWord = useCallback(
    async (input: {
      term: string;
      translation?: string;
      context?: string;
      source?: string;
    }) => {
      const term = input.term.trim();
      if (!term) return false;
      if (words.some((word) => word.term.toLowerCase() === term.toLowerCase())) {
        return false;
      }
      await send<VocabWord[]>("/api/vocab", "POST", {
        term,
        translation: (input.translation ?? "").trim(),
        context: (input.context ?? "").trim(),
        source: input.source ?? "Saved by me",
      });
      refresh();
      return true;
    },
    [words, refresh],
  );

  const removeWord = useCallback(
    async (id: string) => {
      await send<VocabWord[]>(`/api/vocab/${id}`, "DELETE");
      refresh();
    },
    [refresh],
  );

  const review = useCallback(
    async (id: string, known: boolean) => {
      const word = words.find((entry) => entry.id === id);
      if (!word) return;
      await send<VocabWord[]>(`/api/vocab/${id}`, "PATCH", {
        box: known ? Math.min(5, word.box + 1) : 1,
      });
      refresh();
    },
    [words, refresh],
  );

  return { words, hydrated: data !== undefined, addWord, removeWord, review, refresh };
}

export function vocabStats(words: VocabWord[]) {
  const mastered = words.filter((w) => w.box >= 4).length;
  const learning = words.filter((w) => w.box > 1 && w.box < 4).length;
  const fresh = words.filter((w) => w.box <= 1).length;
  const masteredPct = words.length ? Math.round((mastered / words.length) * 100) : 0;
  return { total: words.length, mastered, learning, fresh, masteredPct };
}

export function quizQueue(words: VocabWord[]) {
  return [...words].sort((a, b) => {
    if (a.box !== b.box) return a.box - b.box;
    const at = a.lastReviewedAt ? Date.parse(a.lastReviewedAt) : 0;
    const bt = b.lastReviewedAt ? Date.parse(b.lastReviewedAt) : 0;
    return at - bt;
  });
}
