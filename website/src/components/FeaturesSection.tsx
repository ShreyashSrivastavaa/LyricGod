"use client";

import { motion } from "motion/react";
import {
  Lightning,
  Cpu,
  PaintBrush,
  Keyboard,
  ArrowsOut,
  ShieldCheck,
} from "@phosphor-icons/react";

const features = [
  {
    icon: Lightning,
    title: "Instant Startup",
    desc: "Both apps launch in under a second. Built with Rust — not a bloated Electron wrapper.",
    stat: "<1s",
    statLabel: "launch time",
  },
  {
    icon: Cpu,
    title: "Barely There",
    desc: "Under 1% CPU and 40MB RAM. Your system won't even notice it's running.",
    stat: "<1%",
    statLabel: "CPU usage",
  },
  {
    icon: PaintBrush,
    title: "Fully Customizable",
    desc: "Colors, fonts, animations, positions, opacity. Make it yours with deep customization controls.",
    stat: "50+",
    statLabel: "settings",
  },
  {
    icon: Keyboard,
    title: "Keyboard First",
    desc: "Global shortcuts to toggle, cycle styles, adjust opacity, and control everything without clicking.",
    stat: "12",
    statLabel: "shortcuts",
  },
  {
    icon: ArrowsOut,
    title: "Multi-Monitor Ready",
    desc: "Run on any display. Pin lyrics to your secondary monitor while ambient glow wraps your primary.",
    stat: "∞",
    statLabel: "monitors",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Respecting",
    desc: "No analytics. No tracking. No ads. Only your license key validation touches the network.",
    stat: "0",
    statLabel: "trackers",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-32">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-indigo-600/5 blur-[160px]" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">
            Built different
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto text-base leading-relaxed">
            Not another Electron app. Native performance. Real engineering.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group relative rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-2.5">
                  <f.icon size={20} className="text-zinc-400" />
                </div>
                <div className="text-right">
                  <span className="block text-2xl font-bold tracking-tight text-white">
                    {f.stat}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                    {f.statLabel}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
