"use client";

import { motion } from "motion/react";

const techItems = [
  { label: "Rust", detail: "Core engine & audio processing" },
  { label: "Tauri 2", detail: "Native desktop shell" },
  { label: "React", detail: "Settings & control panel UI" },
  { label: "WebGL", detail: "GPU-accelerated overlays" },
  { label: "WASAPI", detail: "System audio capture" },
  { label: "LRCLIB", detail: "Synchronized lyrics data" },
];

export function TechStackSection() {
  return (
    <section className="relative py-24 border-t border-zinc-800/40">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-4xl font-bold tracking-tighter mb-4">
              Rust under the hood.
              <br />
              <span className="text-zinc-500">React on the surface.</span>
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed max-w-md mb-6">
              Not an Electron app pretending to be native. Real system-level
              audio capture. Real GPU rendering. Real performance. The installer
              is under 10MB.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Under 40MB RAM at runtime
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {techItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-4 text-center"
              >
                <span className="text-sm font-semibold text-white block mb-1">
                  {item.label}
                </span>
                <span className="text-[11px] text-zinc-600">{item.detail}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
