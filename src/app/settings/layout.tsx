"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200/80 bg-white/70 px-3 py-3 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-900/60 sm:px-4">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/chat" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand shadow-md shadow-teal-500/20">
                <span className="text-sm font-bold text-white">H</span>
              </div>
              <span className="font-semibold">Hada</span>
            </Link>
            <span className="hidden text-zinc-300 dark:text-zinc-700 sm:inline">/</span>
            <span className="truncate text-zinc-500">Settings</span>
          </div>
          <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto sm:gap-2">
            <ThemeToggle />
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                <span className="sm:hidden">Chat</span>
                <span className="hidden sm:inline">Back to Chat</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="px-2 sm:px-3" onClick={handleSignOut}>
              <span className="sm:hidden">Exit</span>
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
