import type { Metadata } from "next";
import { notFound } from "next/navigation";

import en from "@/messages/en/course.json";
import { units, unitsBySlug } from "@/lib/training";
import { UnitView } from "./view";

function english(key: string): string {
  let node: unknown = en;
  for (const part of key.replace(/^course\./, "").split(".")) {
    if (typeof node !== "object" || node === null) return key;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : key;
}

export function generateStaticParams() {
  return units.map((unit) => ({ unit: unit.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/onboarding/[unit]">): Promise<Metadata> {
  const { unit: slug } = await params;
  const unit = unitsBySlug.get(slug);
  if (!unit) return { title: "Training" };
  return {
    title: `${english(unit.title)} — Unit ${unit.order}`,
    description: english(unit.summary),
  };
}

export default async function UnitPage({ params }: PageProps<"/onboarding/[unit]">) {
  const { unit: slug } = await params;
  if (!unitsBySlug.has(slug)) notFound();
  return <UnitView slug={slug} />;
}
