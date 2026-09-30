import {
  BookMarked,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import type { NavItem } from "@/components/portal/app-shell";
import { NewHomeworkBadge } from "@/components/portal/nav-badge";

export const studentNav: NavItem[] = [
  { href: "/onboarding", labelKey: "nav.onboarding", icon: Sparkles },
  { href: "/learning", labelKey: "nav.learning", icon: GraduationCap },
  {
    href: "/assignments",
    labelKey: "nav.assignments",
    icon: ClipboardCheck,
    badge: NewHomeworkBadge,
  },
  { href: "/attendance", labelKey: "nav.attendance", icon: CalendarCheck },
  { href: "/vocab", labelKey: "nav.vocab", icon: BookMarked },
];
