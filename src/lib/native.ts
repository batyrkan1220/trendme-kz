import { Capacitor } from "@capacitor/core";

/**
 * Returns true when running inside a native iOS/Android shell.
 * Uses both Capacitor bridge detection and URL param fallback for remote URL mode.
 */
const checkNative = () => {
  const capacitorNative = Capacitor.isNativePlatform();
  const urlParams = new URLSearchParams(window.location.search);
  const urlNative = urlParams.has("native");
  console.log("[native] Capacitor.isNativePlatform():", capacitorNative);
  console.log("[native] URL search:", window.location.search);
  console.log("[native] urlParams.has('native'):", urlNative);
  console.log("[native] userAgent:", navigator.userAgent);
  return capacitorNative || urlNative;
};

export const isNativePlatform = checkNative();

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
