import type { ConfigContext, ExpoConfig } from "expo/config";
import fs from "node:fs";
import path from "node:path";

function loadRootEnv(): void {
  const envPath = path.resolve(__dirname, "../../.env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key.startsWith("EXPO_PUBLIC_") && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadRootEnv();

export default ({ config }: ConfigContext): ExpoConfig => config;
