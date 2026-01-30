import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, env vars may not be available
    // Return a dummy client that will fail gracefully at runtime
    if (typeof window === "undefined") {
      return createBrowserClient(
        "https://placeholder.supabase.co",
        "placeholder-key"
      );
    }
    throw new Error("Missing Supabase environment variables");
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
