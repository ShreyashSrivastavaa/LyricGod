"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CaretDown } from "@phosphor-icons/react";

const faqs = [
  {
    q: "What music apps does LyricGod work with?",
    a: "LyricGod detects your currently playing track through Windows Media Session, which supports Spotify, Apple Music, YouTube Music (in browser), and most other music players. You don't need to connect any accounts.",
  },
  {
    q: "Where do the lyrics come from?",
    a: "We use LRCLIB, a free and open community-contributed lyrics database with time-synchronized data. About 90% of popular tracks have word-level sync. For tracks without sync data, we show plain lyrics.",
  },
  {
    q: "Will it slow down my computer?",
    a: "No. Both apps are built with Rust and Tauri, consuming under 1% CPU and around 40MB RAM. They pause automatically when your screen is locked or inactive.",
  },
  {
    q: "Does AuraGlow work with games?",
    a: "Yes, in borderless windowed mode. True exclusive fullscreen games render over all overlays by design. We recommend borderless windowed mode for the best experience.",
  },
  {
    q: "Can I use both apps at the same time?",
    a: "Absolutely. LyricGod and AuraGlow are designed to run simultaneously. Floating lyrics with ambient screen glow is the ideal setup.",
  },
  {
    q: "Is there a macOS version?",
    a: "Windows is our launch platform. macOS support is on our roadmap and will be available after the Windows release stabilizes. A single Pro license will cover both platforms.",
  },
  {
    q: "What if I change computers?",
    a: "Your license key can be deactivated from the old machine and reactivated on a new one. Contact support if you need help.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes. If you're not satisfied within 14 days of purchase, we'll refund your payment. No questions asked.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-zinc-800/60">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-sm font-medium text-zinc-200 pr-8">{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <CaretDown size={16} className="text-zinc-500 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-zinc-500 leading-relaxed max-w-2xl">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="relative py-32">
      <div className="mx-auto max-w-2xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
            Questions
          </h2>
          <p className="text-zinc-400 text-base">
            Everything you need to know.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border-t border-zinc-800/60"
        >
          {faqs.map((faq) => (
            <FAQItem key={faq.q} {...faq} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
