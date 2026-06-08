import { Platform } from "react-native";
import { setBaseUrl } from "@workspace/api-client-react";

/**
 * Resolve the API server base URL for the admin Android app.
 *
 * Priority:
 * 1. EXPO_PUBLIC_API_URL — explicit URL (required for physical devices on LAN)
 * 2. EXPO_PUBLIC_DOMAIN — Replit / hosted deployment
 * 3. Dev fallback — Android emulator uses 10.0.2.2, iOS simulator uses localhost
 */
export function configureApiClient(): void {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) {
    setBaseUrl(configured.replace(/\/+$/, ""));
    return;
  }

  const domain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  if (domain) {
    setBaseUrl(`https://${domain}`.replace(/\/+$/, ""));
    return;
  }

  if (__DEV__) {
    const host = Platform.OS === "android" ? "10.0.2.2" : "localhost";
    setBaseUrl(`http://${host}:8080`);
    return;
  }

  console.warn(
    "[api] Set EXPO_PUBLIC_API_URL to your API server (e.g. https://your-server.com or http://192.168.1.10:8080)",
  );
}
