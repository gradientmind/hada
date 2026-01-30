"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface GoogleIntegrationStatus {
  connected: boolean;
  connectedAt?: string;
  lastSync?: string;
}

const staticIntegrations = [
  {
    id: "telegram",
    name: "Telegram",
    description: "Connect your Telegram account to chat with Hada via Telegram.",
    icon: TelegramIcon,
    comingSoon: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Connect WhatsApp to message Hada from your phone.",
    icon: WhatsAppIcon,
    comingSoon: true,
  },
  {
    id: "microsoft",
    name: "Microsoft",
    description: "Connect Outlook Calendar and Mail for Microsoft 365.",
    icon: MicrosoftIcon,
    comingSoon: true,
  },
];

export function IntegrationsTab() {
  const [googleStatus, setGoogleStatus] = useState<GoogleIntegrationStatus>({ connected: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const searchParams = useSearchParams();

  // Fetch Google integration status
  useEffect(() => {
    fetchGoogleStatus();
  }, []);

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "google_connected") {
      setMessage({ type: "success", text: "Google account connected successfully!" });
      fetchGoogleStatus();
      // Clear URL params
      window.history.replaceState({}, "", "/settings");
    } else if (error) {
      const errorMessages: Record<string, string> = {
        google_oauth_denied: "You denied access to your Google account.",
        invalid_oauth_response: "Invalid OAuth response from Google.",
        invalid_state: "Invalid state parameter. Please try again.",
        not_authenticated: "You must be logged in to connect integrations.",
        token_exchange_failed: "Failed to exchange authorization code.",
        no_refresh_token: "Failed to get refresh token from Google.",
        database_error: "Failed to save integration. Please try again.",
        unknown_error: "An unknown error occurred. Please try again.",
      };
      setMessage({
        type: "error",
        text: errorMessages[error] || "Failed to connect Google account.",
      });
      // Clear URL params
      window.history.replaceState({}, "", "/settings");
    }

    // Clear message after 5 seconds
    if (success || error) {
      setTimeout(() => setMessage(null), 5000);
    }
  }, [searchParams]);

  async function fetchGoogleStatus() {
    try {
      const response = await fetch("/api/integrations/google");
      if (response.ok) {
        const data = await response.json();
        setGoogleStatus(data);
      }
    } catch (error) {
      console.error("Error fetching Google status:", error);
    }
  }

  async function handleGoogleConnect() {
    window.location.href = "/api/auth/google/authorize";
  }

  async function handleGoogleDisconnect() {
    if (!confirm("Are you sure you want to disconnect your Google account?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/integrations/google", {
        method: "DELETE",
      });

      if (response.ok) {
        setGoogleStatus({ connected: false });
        setMessage({ type: "success", text: "Google account disconnected successfully." });
      } else {
        setMessage({ type: "error", text: "Failed to disconnect Google account." });
      }
    } catch (error) {
      console.error("Error disconnecting Google:", error);
      setMessage({ type: "error", text: "Failed to disconnect Google account." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Integrations</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Connect your accounts to let Hada help with more tasks.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4">
        {/* Google Integration (functional) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <GoogleIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Google</CardTitle>
                    {googleStatus.connected && (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckIcon className="h-3 w-3" />
                        Connected
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    Connect Google Calendar and Gmail for scheduling and email.
                  </CardDescription>
                  {googleStatus.connected && googleStatus.lastSync && (
                    <p className="text-xs text-zinc-400 mt-1">
                      Last synced: {new Date(googleStatus.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant={googleStatus.connected ? "outline" : "default"}
                size="sm"
                onClick={googleStatus.connected ? handleGoogleDisconnect : handleGoogleConnect}
                disabled={loading}
              >
                {loading ? "..." : googleStatus.connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Other integrations (coming soon) */}
        {staticIntegrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <integration.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#00A4EF" d="M1 13h10v10H1z"/>
      <path fill="#7FBA00" d="M13 1h10v10H13z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  );
}
