import type { Metadata } from "next";

import { VocabView } from "./view";

export const metadata: Metadata = {
  title: "My Vocabulary Bank",
  description:
    "Save new English words from lessons and homework, then revise them with auto-generated flashcard quizzes.",
};

export default function VocabPage() {
  return <VocabView />;
}
