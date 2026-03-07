import { Capacitor } from "@capacitor/core";

/**
 * Returns true when running inside a native iOS/Android shell.
 * Safe to call anywhere — returns false on web.
 */
export const isNativePlatform = Capacitor.isNativePlatform();

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
