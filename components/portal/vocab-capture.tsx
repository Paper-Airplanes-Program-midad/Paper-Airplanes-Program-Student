"use client";

import { BookmarkPlus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, Input, useToast } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useVocab } from "@/lib/vocab";

export function VocabCapture({ source }: { source: string }) {
  const { t } = useI18n();
  const { addWord } = useVocab();
  const toast = useToast();
  const [term, setTerm] = useState("");
  const [context, setContext] = useState("");
  const [translation, setTranslation] = useState("");

  useEffect(() => {
    const onSelect = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? "";
      if (!text || text.length > 60 || text.split(/\s+/).length > 4) return;
      const sentence = selection?.anchorNode?.textContent?.trim().slice(0, 160) ?? "";
      setTerm(text);
      setContext(sentence === text ? "" : sentence);
      setTranslation("");
    };
    document.addEventListener("mouseup", onSelect);
    document.addEventListener("touchend", onSelect);
    return () => {
      document.removeEventListener("mouseup", onSelect);
      document.removeEventListener("touchend", onSelect);
    };
  }, []);

  if (!term) return null;

  const save = async () => {
    const saved = await addWord({ term, translation, context, source });
    toast[saved ? "success" : "info"](t(saved ? "vocab.saved" : "vocab.duplicate"));
    setTerm("");
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl">
      <div className="glass toast-in rounded-3xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-fg">{term}</p>
            <p className="truncate text-[12px] text-fg-muted">{t("vocab.capturehint")}</p>
          </div>
          <button
            type="button"
            aria-label={t("common.cancel")}
            onClick={() => setTerm("")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-tint text-fg-muted transition-colors hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            wrapperClassName="flex-1"
            value={translation}
            onChange={(event) => setTranslation(event.target.value)}
            placeholder={t("vocab.translation")}
          />
          <Button onClick={save}>
            <BookmarkPlus className="h-4 w-4" />
            {t("vocab.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
