"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 py-12">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative h-7 w-7">
                <div className="absolute inset-0 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 opacity-80" />
                <div className="absolute inset-[2px] rounded-[4px] bg-zinc-950 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">L</span>
                </div>
              </div>
              <span className="text-sm font-semibold tracking-tight">
                LyricGod
              </span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed max-w-[200px]">
              Premium desktop experiences for music lovers. Built with Rust.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 mb-3">
              Products
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#products"
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  LyricGod
                </a>
              </li>
              <li>
                <a
                  href="#products"
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  AuraGlow
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 mb-3">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#faq"
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  System Requirements
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-zinc-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-zinc-700">
            © 2026 LyricGod. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors"
            >
              Discord
            </a>
            <a
              href="#"
              className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
