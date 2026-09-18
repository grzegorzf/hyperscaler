/**
 * W3C View Transitions API Level 2 Helper
 * 
 * Safely wraps state mutations in document.startViewTransition if supported
 * and motion is not reduced, providing 120 FPS FLIP-free DOM morphing.
 */

import { supportsViewTransitions, isBrowser } from "./webApis";

export function safeStartViewTransition(updateCallback: () => void): void {
  if (!isBrowser()) {
    updateCallback();
    return;
  }

  // Respect user preference for reduced motion
  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (supportsViewTransitions() && !prefersReducedMotion) {
    try {
      (document as any).startViewTransition(() => {
        updateCallback();
      });
      return;
    } catch {
      // Fallback to direct execution on any browser error
      updateCallback();
      return;
    }
  }

  updateCallback();
}
