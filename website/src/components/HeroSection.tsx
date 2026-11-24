"use client";

import { motion } from "motion/react";
import { Sparkle, Play } from "@phosphor-icons/react";

export function HeroSection() {
  return (
    <section className="relative min-h-[92dvh] flex items-center justify-center overflow-hidden pt-20">
      {/* Background glow orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-emerald-500/12 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[180px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-4 py-1.5 text-xs text-indigo-300 backdrop-blur-md">
            <Sparkle size={14} weight="fill" className="text-emerald-400" />
            Combined Mode: Real-time Lyrics + Screen-Edge Ambient Glow
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter leading-[1.05] max-w-4xl mx-auto"
        >
          Float your lyrics.
          <br />
          <span className="gradient-text-lyric">Illuminate your room.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-6 text-base md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
        >
          Why choose between ambient screen lighting and word-by-word synchronized
          lyrics? Run both simultaneously right in your browser with zero
          installation.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#studio"
            className="flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-zinc-950 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-indigo-500/10 active:scale-[0.98]"
          >
            <Play size={16} weight="fill" className="text-indigo-600" />
            Experience Combined Studio
          </a>
          <a
            href="#products"
            className="rounded-full border border-zinc-700 bg-zinc-900/40 px-8 py-3.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-500 hover:text-white active:scale-[0.98]"
          >
            Explore Features
          </a>
        </motion.div>

        {/* Combined Mode interactive preview banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65 }}
          className="mt-12 flex items-center justify-center gap-6 text-xs text-zinc-500"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Zero Installation Needed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            Works on Any Device
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            Web Audio Beat Reactivity
          </span>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
