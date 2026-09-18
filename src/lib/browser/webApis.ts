/**
 * Modern Native Browser Web APIs Utility Layer
 * 
 * Provides SSR-safe feature detection, tactile haptic feedback cadences,
 * Screen Wake Lock kiosk lifecycle, and native Web Streams GZIP compression.
 */

// --- Feature Detection ---

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function supportsViewTransitions(): boolean {
  return isBrowser() && "startViewTransition" in document;
}

export function supportsVibration(): boolean {
  return isBrowser() && typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function supportsWakeLock(): boolean {
  return isBrowser() && typeof navigator !== "undefined" && "wakeLock" in navigator;
}

export function supportsBroadcastChannel(): boolean {
  return isBrowser() && typeof window.BroadcastChannel !== "undefined";
}

export function supportsCompressionStream(): boolean {
  return (
    typeof CompressionStream !== "undefined" &&
    typeof Response !== "undefined"
  );
}

// --- Tactile Haptic Feedback (Vibration API) ---

export type HapticIntensity = "light" | "medium" | "heavy" | "chaos";

const HAPTIC_PATTERNS: Record<HapticIntensity, number | number[]> = {
  light: 12, // Subtle tick for slider steps
  medium: 25, // Noticeable snap for provider / scaling switches
  heavy: 45, // Thud for scenario activation
  chaos: [40, 60, 40, 80, 100], // Staccato emergency cadence for Chaos Monkey
};

/**
 * Trigger physical haptic feedback if supported by device/browser.
 * Safely no-ops in SSR or on unsupported devices without errors.
 */
export function triggerHaptic(intensity: HapticIntensity = "light"): boolean {
  if (!supportsVibration()) return false;
  try {
    const pattern = HAPTIC_PATTERNS[intensity];
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

// --- Screen Wake Lock API (Kiosk & Wallboard Mode) ---

let activeWakeLockSentinel: any = null;
const wakeLockListeners: Set<(active: boolean) => void> = new Set();

function notifyWakeLockSubscribers(active: boolean) {
  wakeLockListeners.forEach((fn) => {
    try {
      fn(active);
    } catch {
      // Ignore subscriber errors
    }
  });
}

/**
 * Requests a screen wake lock so the display remains awake during simulations.
 */
export async function requestWakeLock(): Promise<boolean> {
  if (!supportsWakeLock()) return false;

  try {
    if (activeWakeLockSentinel && !activeWakeLockSentinel.released) {
      return true;
    }

    const sentinel = await (navigator as any).wakeLock.request("screen");
    activeWakeLockSentinel = sentinel;

    sentinel.addEventListener("release", () => {
      activeWakeLockSentinel = null;
      notifyWakeLockSubscribers(false);
    });

    notifyWakeLockSubscribers(true);
    return true;
  } catch {
    activeWakeLockSentinel = null;
    notifyWakeLockSubscribers(false);
    return false;
  }
}

/**
 * Releases the screen wake lock.
 */
export async function releaseWakeLock(): Promise<boolean> {
  if (!activeWakeLockSentinel) return false;

  try {
    await activeWakeLockSentinel.release();
    activeWakeLockSentinel = null;
    notifyWakeLockSubscribers(false);
    return true;
  } catch {
    activeWakeLockSentinel = null;
    notifyWakeLockSubscribers(false);
    return false;
  }
}

/**
 * Check whether the screen wake lock is currently active.
 */
export function isWakeLockActive(): boolean {
  return !!activeWakeLockSentinel && !activeWakeLockSentinel.released;
}

/**
 * Subscribe to wake lock state changes. Returns an unsubscribe callback.
 */
export function subscribeWakeLock(callback: (active: boolean) => void): () => void {
  wakeLockListeners.add(callback);
  callback(isWakeLockActive());
  return () => {
    wakeLockListeners.delete(callback);
  };
}

// --- Native GZIP Compression (CompressionStream) ---

export interface CompressionResult {
  blob: Blob;
  originalBytes: number;
  compressedBytes: number;
  ratioPercent: number;
}

/**
 * Compresses an input string to a GZIP Blob using native browser Web Streams CompressionStream.
 */
export async function compressGzip(text: string): Promise<CompressionResult> {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(text);
  const originalBytes = rawBytes.byteLength;

  if (!supportsCompressionStream()) {
    // Graceful fallback: return uncompressed blob
    const fallbackBlob = new Blob([rawBytes], { type: "text/plain;charset=utf-8" });
    return {
      blob: fallbackBlob,
      originalBytes,
      compressedBytes: originalBytes,
      ratioPercent: 0,
    };
  }

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(rawBytes);
      controller.close();
    },
  });

  const compressionStream = new CompressionStream("gzip");
  const compressedStream = stream.pipeThrough(compressionStream);
  const response = new Response(compressedStream);
  const compressedBuffer = await response.arrayBuffer();

  const compressedBytes = compressedBuffer.byteLength;
  const ratioPercent =
    originalBytes > 0
      ? Math.max(0, Math.round(((originalBytes - compressedBytes) / originalBytes) * 100))
      : 0;

  const blob = new Blob([compressedBuffer], { type: "application/gzip" });

  return {
    blob,
    originalBytes,
    compressedBytes,
    ratioPercent,
  };
}
