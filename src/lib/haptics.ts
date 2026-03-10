import { isNativePlatform } from "./native";

/**
 * Lightweight haptic feedback wrapper for Capacitor.
 * Falls back silently on web.
 */
export async function hapticLight() {
  if (!isNativePlatform) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}

export async function hapticMedium() {
  if (!isNativePlatform) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {}
}

export async function hapticSuccess() {
  if (!isNativePlatform) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {}
}

export async function hapticSelection() {
  if (!isNativePlatform) return;
  try {
    const { Haptics } = await import("@capacitor/haptics");
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  } catch {}
}
