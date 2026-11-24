"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { exchangeCodeForToken } from "@/lib/spotify/auth";
import { ArrowLeft, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      if (error === "access_denied") {
        setErrorMessage("You cancelled the Spotify login request. No changes were made.");
      } else {
        setErrorMessage(`Spotify authorization error: ${error}`);
      }
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setErrorMessage("Missing authorization code or state parameter from Spotify.");
      return;
    }

    const processAuth = async () => {
      const res = await exchangeCodeForToken(code, state);
      if (res.success) {
        setStatus("success");
        // Redirect back to studio after short confirmation
        setTimeout(() => {
          router.replace("/#studio");
        }, 800);
      } else {
        setStatus("error");
        setErrorMessage(res.error || "Failed to exchange code for tokens.");
      }
    };

    processAuth();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="relative max-w-md w-full rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10 text-center backdrop-blur-2xl shadow-2xl">
        {status === "loading" && (
          <div className="space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] animate-pulse">
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.216.353-.675.467-1.028.251-2.817-1.722-6.362-2.112-10.538-1.157-.402.093-.805-.157-.898-.56-.093-.403.158-.805.56-.898 4.571-1.045 8.492-.595 11.654 1.336.353.216.467.674.25 1.028zm1.467-3.262c-.272.443-.852.583-1.295.311-3.226-1.983-8.144-2.556-11.959-1.399-.499.152-1.031-.132-1.183-.631-.152-.499.132-1.031.631-1.183 4.367-1.325 9.789-.687 13.495 1.591.444.272.584.851.311 1.311zm.126-3.411C15.228 8.358 8.874 8.148 5.163 9.274c-.604.184-1.246-.16-1.43-.765-.183-.604.161-1.246.765-1.43 4.269-1.296 11.289-1.051 15.75 1.599.543.322.723 1.027.401 1.57-.323.543-1.028.723-1.571.401z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Connecting to Spotify</h2>
            <p className="text-xs text-zinc-400">Exchanging authorization credentials...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle size={32} weight="fill" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Connected!</h2>
            <p className="text-xs text-zinc-400">Redirecting to your LyricGod studio...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <WarningCircle size={32} weight="fill" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Authentication Notice</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {errorMessage}
            </p>
            <div className="pt-2">
              <Link
                href="/#studio"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-semibold text-zinc-950 hover:scale-105 active:scale-95 transition-all"
              >
                <ArrowLeft size={14} />
                Return to Studio
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
          <p className="text-xs text-zinc-500 animate-pulse">Loading Spotify session...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
