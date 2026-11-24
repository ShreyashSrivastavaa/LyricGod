"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { List, X, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";

const links = [
  { href: "#studio", label: "Live Studio", isSpecial: true },
  { href: "#products", label: "Combined Mode" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-800/40">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400 opacity-90 shadow-md shadow-indigo-500/20" />
              <div className="absolute inset-[2px] rounded-[6px] bg-zinc-950 flex items-center justify-center">
                <span className="text-sm font-bold text-white">L</span>
              </div>
            </div>
            <span className="text-lg font-semibold tracking-tight">
              LyricGod
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  link.isSpecial
                    ? "flex items-center gap-1.5 text-indigo-400 font-medium hover:text-indigo-300"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {link.isSpecial && <Sparkle size={13} weight="fill" />}
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="#studio"
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-950 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10"
            >
              <Sparkle size={14} weight="fill" className="text-indigo-600" />
              Launch Studio
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-zinc-400 hover:text-white"
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl"
          >
            <div className="px-6 py-4 space-y-3">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-zinc-400 hover:text-white py-2"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#studio"
                onClick={() => setOpen(false)}
                className="block mt-3 rounded-full bg-white px-5 py-2.5 text-center text-sm font-medium text-zinc-950"
              >
                Launch Studio
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
