"use client";

import { motion } from "motion/react";
import { Check, Star } from "@phosphor-icons/react";

const plans = [
  {
    name: "Free",
    price: "₹0",
    priceUsd: "$0",
    period: "forever",
    description: "Try it out. No credit card needed.",
    features: [
      "3 lyrics animation styles",
      "3 ambient lighting presets",
      "Basic color customization",
      "Single monitor support",
      "System tray operation",
      "Auto-detect current song",
    ],
    cta: "Download Free",
    href: "#",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹499",
    priceUsd: "$7.99",
    period: "lifetime",
    description: "Everything. Once. Forever.",
    features: [
      "All 8 lyrics styles + future ones",
      "All 8+ ambient presets",
      "Custom color palettes & gradients",
      "Multi-monitor support",
      "Audio visualizer overlay",
      "Screen content color sampling",
      "Custom fonts & themes",
      "Sync offset adjustment",
      "Priority support",
    ],
    cta: "Get Pro",
    href: "#",
    highlight: true,
  },
  {
    name: "Bundle",
    price: "₹799",
    priceUsd: "$12.99",
    period: "lifetime",
    description: "Both apps. Best value.",
    features: [
      "LyricGod Pro — full access",
      "AuraGlow Pro — full access",
      "Single license key for both",
      "All future updates included",
      "Cross-device activation",
      "Priority support",
    ],
    cta: "Get Bundle",
    href: "#",
    highlight: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-32">
      <div className="mx-auto max-w-[1400px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">
            Simple pricing
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto text-base leading-relaxed">
            Pay once, own it forever. No subscriptions. No hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl border p-6 md:p-8 flex flex-col ${
                plan.highlight
                  ? "border-indigo-500/30 bg-indigo-500/5"
                  : "border-zinc-800 bg-zinc-900/30"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium text-white">
                  <Star size={12} weight="fill" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-zinc-500">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-white">
                    {plan.price}
                  </span>
                  <span className="text-sm text-zinc-500">
                    / {plan.period}
                  </span>
                </div>
                <span className="text-xs text-zinc-600">{plan.priceUsd}</span>
              </div>

              <ul className="mb-8 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      size={16}
                      weight="bold"
                      className={`mt-0.5 flex-shrink-0 ${
                        plan.highlight ? "text-indigo-400" : "text-zinc-600"
                      }`}
                    />
                    <span className="text-sm text-zinc-400">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`block w-full rounded-full py-3 text-center text-sm font-semibold transition-all active:scale-[0.98] ${
                  plan.highlight
                    ? "bg-white text-zinc-950 hover:scale-[1.02] hover:shadow-lg hover:shadow-white/10"
                    : "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Trust note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10 text-xs text-zinc-600"
        >
          Secure payment via Razorpay & Stripe. License key delivered instantly.
          Works on Windows 10+.
        </motion.p>
      </div>
    </section>
  );
}
