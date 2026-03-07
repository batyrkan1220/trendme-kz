import { Capacitor } from "@capacitor/core";

/**
 * Returns true when running inside a native iOS/Android shell.
 * Uses both Capacitor bridge detection and URL param fallback for remote URL mode.
 */
export const isNativePlatform =
  Capacitor.isNativePlatform() ||
  new URLSearchParams(window.location.search).has("native");

/**
 * Initialize native-specific settings (status bar, etc.)
 * Call once at app startup.
 */
export async function initNativeApp() {
  if (!isNativePlatform) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    // StatusBar plugin not available
  }
}
