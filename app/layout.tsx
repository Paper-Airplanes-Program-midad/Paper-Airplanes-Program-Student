import type { Metadata, Viewport } from "next";
import { Cairo, Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";

import { themeScript } from "@/components/ui";
import { localeScript } from "@/lib/i18n";
import { Providers } from "./providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://paper-airplanes-program-student.vercel.app"),
  title: {
    default: "Student Portal — Paper Airplanes",
    template: "%s · Paper Airplanes",
  },
  description:
    "Onboarding, one-to-one lessons in your own timezone, assignments and attendance for Paper Airplanes learners.",
  applicationName: "Paper Airplanes Student Portal",
  openGraph: {
    title: "Student Portal — Paper Airplanes",
    description:
      "Onboarding, lessons and assignments for learners affected by conflict.",
    url: "/",
    siteName: "Paper Airplanes",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Student Portal — Paper Airplanes",
    description: "Onboarding, lessons and assignments.",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#04050d" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${jakarta.variable} ${instrument.variable} ${cairo.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: localeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        </noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
