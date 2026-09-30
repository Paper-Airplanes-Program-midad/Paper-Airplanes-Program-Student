import type { Metadata } from "next";

import { SignInView } from "./sign-in-view";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to the Paper Airplanes student portal to reach your lessons, assignments and attendance.",
};

export default function SignInPage() {
  return <SignInView />;
}
