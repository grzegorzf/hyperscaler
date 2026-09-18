"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  PanelPosition,
  clampPosition,
  loadStoredLayout,
  saveStoredLayout,
  ClampingBounds,
} from "@/lib/browser/draggableMath";
import { triggerHaptic } from "@/lib/browser/webApis";

interface UseDraggablePanelOptions {
  id: string;
  defaultPosition: PanelPosition;
  bounds?: ClampingBounds;
}

export function useDraggablePanel({
  id,
  defaultPosition,
  bounds,
}: UseDraggablePanelOptions) {
  const [position, setPosition] = useState<PanelPosition>(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultPosition.isCollapsed ?? false);
  const [isHydrated, setIsHydrated] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number }>({ pointerX: 0, pointerY: 0 });
  const panelStartPosRef = useRef<{ x: number; y: number }>({ x: defaultPosition.x, y: defaultPosition.y });
  const positionRef = useRef<PanelPosition>(defaultPosition);

  // Keep positionRef in sync
  positionRef.current = position;

  // Hydrate from localStorage once mounted
  useEffect(() => {
    setIsHydrated(true);
    const stored = loadStoredLayout();
    if (stored[id]) {
      const panelEl = panelRef.current;
      const width = panelEl?.offsetWidth || 360;
      const height = panelEl?.offsetHeight || 200;
      const clamped = clampPosition(
        stored[id],
        { width, height },
        { width: window.innerWidth, height: window.innerHeight },
        bounds
      );
      setPosition(clamped);
      if (stored[id].isCollapsed !== undefined) {
        setIsCollapsed(stored[id].isCollapsed!);
      }
    } else {
      // Re-clamp default position to current viewport
      const panelEl = panelRef.current;
      const width = panelEl?.offsetWidth || 360;
      const height = panelEl?.offsetHeight || 200;
      const clamped = clampPosition(
        defaultPosition,
        { width, height },
        { width: window.innerWidth, height: window.innerHeight },
        bounds
      );
      setPosition(clamped);
    }
  }, [id, bounds, defaultPosition]);

  // Handle browser window resize clamping
  useEffect(() => {
    const handleResize = () => {
      const panelEl = panelRef.current;
      if (!panelEl) return;
      const width = panelEl.offsetWidth;
      const height = panelEl.offsetHeight;
      const clamped = clampPosition(
        positionRef.current,
        { width, height },
        { width: window.innerWidth, height: window.innerHeight },
        bounds
      );
      if (clamped.x !== positionRef.current.x || clamped.y !== positionRef.current.y) {
        setPosition(clamped);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [bounds]);

  // Global layout reset event listener
  useEffect(() => {
    const handleGlobalReset = () => {
      setPosition(defaultPosition);
      setIsCollapsed(defaultPosition.isCollapsed ?? false);
    };

    window.addEventListener("hyperscaler:reset-hud-layout", handleGlobalReset);
    return () => window.removeEventListener("hyperscaler:reset-hud-layout", handleGlobalReset);
  }, [defaultPosition]);

  // Pointer Events Level 3 Drag Handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      // Only drag on primary button
      if (e.button !== 0) return;

      // Don't drag if clicking an interactive control within the handle
      const target = e.target as HTMLElement;
      if (target.closest("button, a, input, select, textarea")) {
        return;
      }

      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture fallback
      }

      triggerHaptic("light");
      setIsDragging(true);

      dragStartRef.current = { pointerX: e.clientX, pointerY: e.clientY };
      panelStartPosRef.current = { x: positionRef.current.x, y: positionRef.current.y };
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!isDragging) return;

      const dx = e.clientX - dragStartRef.current.pointerX;
      const dy = e.clientY - dragStartRef.current.pointerY;

      const tentative = {
        x: panelStartPosRef.current.x + dx,
        y: panelStartPosRef.current.y + dy,
        isCollapsed,
      };

      const panelEl = panelRef.current;
      const width = panelEl?.offsetWidth || 360;
      const height = panelEl?.offsetHeight || 200;

      const clamped = clampPosition(
        tentative,
        { width, height },
        { width: window.innerWidth, height: window.innerHeight },
        bounds
      );

      setPosition(clamped);
    },
    [isDragging, bounds, isCollapsed]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!isDragging) return;

      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore pointer capture release error
      }

      setIsDragging(false);
      triggerHaptic("light");

      // Save to localStorage
      const allStored = loadStoredLayout();
      allStored[id] = {
        x: positionRef.current.x,
        y: positionRef.current.y,
        isCollapsed,
      };
      saveStoredLayout(allStored);
    },
    [isDragging, id, isCollapsed]
  );

  const toggleCollapse = useCallback(() => {
    triggerHaptic("light");
    setIsCollapsed((prev) => {
      const next = !prev;
      const allStored = loadStoredLayout();
      allStored[id] = {
        x: positionRef.current.x,
        y: positionRef.current.y,
        isCollapsed: next,
      };
      saveStoredLayout(allStored);
      return next;
    });
  }, [id]);

  const resetPosition = useCallback(() => {
    triggerHaptic("light");
    setPosition(defaultPosition);
    const allStored = loadStoredLayout();
    allStored[id] = defaultPosition;
    saveStoredLayout(allStored);
  }, [id, defaultPosition]);

  return {
    panelRef,
    position,
    isDragging,
    isCollapsed,
    isHydrated,
    dragHandleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      style: { touchAction: "none" as const },
    },
    toggleCollapse,
    resetPosition,
  };
}
