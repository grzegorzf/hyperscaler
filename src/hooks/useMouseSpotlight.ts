"use client";

import { useCallback } from "react";

/**
 * Hook to power CSS Masking Level 2 & GPU compositor radial spotlighting.
 * Directly mutates CSS variables --mouse-x and --mouse-y on the hovered target,
 * causing ZERO React re-renders while giving 120 FPS hardware acceleration.
 */
export function useMouseSpotlight() {
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--mouse-x", "-999px");
    e.currentTarget.style.setProperty("--mouse-y", "-999px");
  }, []);

  return {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };
}
