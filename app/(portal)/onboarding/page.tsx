import type { Metadata } from "next";

import { OnboardingView } from "./view";

export const metadata: Metadata = {
  title: "Onboarding",
  description:
    "Track your application status, training units, quizzes and waiting-list position.",
};

export default function OnboardingPage() {
  return <OnboardingView />;
}
