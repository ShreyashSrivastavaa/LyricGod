"use client";

import { motion } from "motion/react";

export function CTASection() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-[1400px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 md:p-20 text-center overflow-hidden"
        >
          {/* Background gradients */}
          <div className="absolute top-0 left-1/4 w-[400px] h-[300px] rounded-full bg-indigo-600/8 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] rounded-full bg-emerald-500/6 blur-[100px]" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">
              Your music is playing.
              <br />
              <span className="text-zinc-500">Give it a stage.</span>
            </h2>

            <p className="text-zinc-400 max-w-md mx-auto text-base leading-relaxed mb-8">
              Download both apps free. Upgrade when you want more.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#pricing"
                className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-zinc-950 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-white/10 active:scale-[0.98]"
              >
                Download for Windows
              </a>
              <a
                href="#pricing"
                className="rounded-full border border-zinc-700 px-8 py-3.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-500 hover:text-white active:scale-[0.98]"
              >
                View pricing
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
