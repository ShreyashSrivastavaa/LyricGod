import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LyricGod — Premium Desktop Music Experiences",
  description:
    "Two beautiful desktop applications. Floating lyrics overlays with word-by-word sync. Ambient screen-edge lighting that dances with your music.",
  keywords: [
    "lyrics overlay",
    "ambient lighting",
    "desktop app",
    "music visualizer",
    "screen glow",
  ],
  openGraph: {
    title: "LyricGod — Premium Desktop Music Experiences",
    description:
      "Floating lyrics overlays and ambient screen lighting. Built for music lovers.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="noise min-h-full flex flex-col bg-background text-foreground"
      >
        {children}
      </body>
    </html>
  );
}
