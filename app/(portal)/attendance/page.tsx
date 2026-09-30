import type { Metadata } from "next";

import { AttendanceView } from "./view";

export const metadata: Metadata = {
  title: "Weekly check-in",
  description:
    "Send your weekly check-in, whether the lesson happened or not, and review past weeks.",
};

export default function AttendancePage() {
  return <AttendanceView />;
}
