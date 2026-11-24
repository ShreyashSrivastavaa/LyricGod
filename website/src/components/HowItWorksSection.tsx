"use client";

import { motion } from "motion/react";

const steps = [
  {
    num: "01",
    title: "Download",
    desc: "Grab the free installer. Under 10MB. Installs in seconds.",
    accent: "from-indigo-500/10",
  },
  {
    num: "02",
    title: "Play music",
    desc: "Open Spotify, Apple Music, YouTube, or any player. We detect it automatically.",
    accent: "from-violet-500/10",
  },
  {
    num: "03",
    title: "Enjoy",
    desc: "Lyrics appear on screen. Glow wraps your monitor. Everything just works.",
    accent: "from-emerald-500/10",
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-[1400px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">
            Three steps. That&apos;s it.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-8 text-center"
            >
              <div
                className={`absolute inset-0 rounded-xl bg-gradient-to-b ${step.accent} to-transparent opacity-50`}
              />
              <div className="relative z-10">
                <span className="text-5xl font-bold tracking-tighter text-zinc-800 block mb-4">
                  {step.num}
                </span>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
