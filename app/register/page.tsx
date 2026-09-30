import type { Metadata } from "next";

import { RegisterView } from "./register-view";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Open a Paper Airplanes student account to reach your lessons, homework and attendance.",
};

export default function RegisterPage() {
  return <RegisterView />;
}
