"use client";

import { motion } from "motion/react";
import type { Icon } from "@phosphor-icons/react";
import {
  MusicNotes,
  Waveform,
  TextAa,
  Monitor,
  Palette,
  SpeakerHigh,
  Sparkle,
  Eye,
} from "@phosphor-icons/react";

const combinedHighlights = [
  {
    icon: Sparkle,
    title: "Dual Sync Engine",
    desc: "Your screen border blooms in sync with audio beats while lyrics illuminate word-by-word simultaneously.",
  },
  {
    icon: Eye,
    title: "Zero Focus Theft",
    desc: "Floating lyrics and screen-edge ambient illumination render without interfering with your work or gaming.",
  },
  {
    icon: Palette,
    title: "Unified Color Matching",
    desc: "The ambient perimeter glow and lyrics highlights share matching gradient tones extracted from the song artwork.",
  },
  {
    icon: Monitor,
    title: "Browser Fullscreen Mode",
    desc: "With one click, turn your entire monitor into an ambient illuminated stage with floating words.",
  },
];

const lyricFeatures = [
  {
    icon: TextAa,
    title: "Word-by-Word Sync",
    desc: "Every word lights up at the exact millisecond it's sung. Not line-by-line. Word-by-word.",
  },
  {
    icon: Palette,
    title: "5 Typography Styles",
    desc: "Karaoke Glow, Fisheye Zoom, Waveform Bounce, Constellation, and Typewriter with custom fonts.",
  },
];

const auraFeatures = [
  {
    icon: Waveform,
    title: "Music-Reactive Glow",
    desc: "Web Audio FFT analysis drives the ambient light. Bass hits expand the glow spread and border width.",
  },
  {
    icon: SpeakerHigh,
    title: "Dynamic Color Palettes",
    desc: "Cyberpunk, Aurora, Sunset Gold, Electric Violet, or custom dual-color gradients.",
  },
];

function FeatureCard({
  icon: IconComponent,
  title,
  desc,
  index,
}: {
  icon: Icon;
  title: string;
  desc: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60"
    >
      <div className="mb-4 inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-2.5">
        <IconComponent size={20} className="text-zinc-400" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export function ProductsSection() {
  return (
    <section id="products" className="relative py-24">
      <div className="mx-auto max-w-[1400px] px-6">
        {/* COMBINED MODE SPOTLIGHT */}
        <div className="mb-24 rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 via-zinc-950 to-zinc-950 p-8 md:p-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300 mb-4">
              <Sparkle size={13} weight="fill" />
              The Combined Master Mode
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 text-white">
              Why settle for one when both look legendary together?
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              Lumn gives you ambient screen lighting. Verci gives you floating
              lyrics. LyricGod unites both into a single seamless, synchronized
              audio-visual spectacle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {combinedHighlights.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>

        {/* Sub-modes: Lyrics & AuraGlow breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LyricGod standalone */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-mono mb-2 block">
                Mode 01
              </span>
              <h3 className="text-2xl font-bold tracking-tight mb-3 text-white">
                LyricGod (Floating Lyrics)
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Word-by-word synchronized typography that dances with the
                vocals. Powered by the open LRCLIB database.
              </p>
              <div className="space-y-4">
                {lyricFeatures.map((f, i) => (
                  <div key={f.title} className="flex gap-3">
                    <f.icon size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-200">
                        {f.title}
                      </h4>
                      <p className="text-xs text-zinc-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <a
              href="#studio"
              className="mt-8 inline-block text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Test Lyrics in Studio →
            </a>
          </div>

          {/* AuraGlow standalone */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-mono mb-2 block">
                Mode 02
              </span>
              <h3 className="text-2xl font-bold tracking-tight mb-3 text-white">
                AuraGlow (Ambient Edge Lighting)
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Illuminates your monitor borders in real-time response to
                music frequency, bass transients, and album artwork.
              </p>
              <div className="space-y-4">
                {auraFeatures.map((f, i) => (
                  <div key={f.title} className="flex gap-3">
                    <f.icon size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-200">
                        {f.title}
                      </h4>
                      <p className="text-xs text-zinc-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <a
              href="#studio"
              className="mt-8 inline-block text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Test AuraGlow in Studio →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
