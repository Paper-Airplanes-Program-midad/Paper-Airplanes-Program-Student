import type { Metadata } from "next";

import { AssignmentsView } from "./view";

export const metadata: Metadata = {
  title: "Assignments",
  description:
    "Submit assignments, track due dates and read your teacher's rubric feedback.",
};

export default function AssignmentsPage() {
  return <AssignmentsView />;
}
