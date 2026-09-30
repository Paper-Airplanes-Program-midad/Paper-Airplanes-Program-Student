import type { Metadata } from "next";

import { LearningView } from "./view";

export const metadata: Metadata = {
  title: "My Learning",
  description:
    "Your teacher, weekly lesson schedule in your local timezone, CEFR progress and exams.",
};

export default function LearningPage() {
  return <LearningView />;
}
