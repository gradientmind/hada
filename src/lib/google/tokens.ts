import { createClient } from "@/lib/supabase/server";
import { GOOGLE_OAUTH_CONFIG } from "./config";

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
}

/**
 * Get Google OAuth tokens for a user from the database
 */
export async function getGoogleTokens(
  userId: string
): Promise<GoogleTokens | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("integrations")
    .select("access_token, refresh_token, expires_at, scopes")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();

  if (error || !data) {
    return null;
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at),
    scopes: data.scopes,
  };
}

/**
 * Check if an access token is expired (with 5 minute buffer)
 */
export function isTokenExpired(expiresAt: Date): boolean {
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  return expiresAt.getTime() - bufferMs < now.getTime();
}

/**
 * Refresh an expired Google access token
 */
export async function refreshGoogleToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date } | null> {
  try {
    const response = await fetch(GOOGLE_OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_OAUTH_CONFIG.clientId,
        client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      console.error("Failed to refresh Google token:", await response.text());
      return null;
    }

    const data = await response.json();

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

    return {
      accessToken: data.access_token,
      expiresAt,
    };
  } catch (error) {
    console.error("Error refreshing Google token:", error);
    return null;
  }
}

/**
 * Update tokens in the database
 */
export async function updateGoogleTokens(
  userId: string,
  accessToken: string,
  expiresAt: Date
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("integrations")
    .update({
      access_token: accessToken,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", "google");

  if (error) {
    console.error("Error updating Google tokens:", error);
    return false;
  }

  return true;
}

/**
 * Ensure we have a valid access token, refreshing if necessary
 */
export async function ensureValidGoogleToken(
  userId: string
): Promise<string | null> {
  const tokens = await getGoogleTokens(userId);

  if (!tokens) {
    return null;
  }

  // Token is still valid
  if (!isTokenExpired(tokens.expiresAt)) {
    return tokens.accessToken;
  }

  // Token is expired, refresh it
  const refreshed = await refreshGoogleToken(tokens.refreshToken);

  if (!refreshed) {
    // Refresh failed - token likely revoked
    // Mark integration as disconnected by deleting it
    const supabase = await createClient();
    await supabase
      .from("integrations")
      .delete()
      .eq("user_id", userId)
      .eq("provider", "google");

    return null;
  }

  // Update database with new token
  const updated = await updateGoogleTokens(
    userId,
    refreshed.accessToken,
    refreshed.expiresAt
  );

  if (!updated) {
    return null;
  }

  return refreshed.accessToken;
}

/**
 * Delete Google integration for a user (disconnect)
 */
export async function deleteGoogleIntegration(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("user_id", userId)
    .eq("provider", "google");

  if (error) {
    console.error("Error deleting Google integration:", error);
    return false;
  }

  return true;
}

/**
 * Check if user has Google integration connected
 */
export async function hasGoogleIntegration(userId: string): Promise<boolean> {
  const tokens = await getGoogleTokens(userId);
  return tokens !== null;
}
