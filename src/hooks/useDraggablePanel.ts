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
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number }>({ pointerX: 0, pointerY: 0 });
  const panelStartPosRef = useRef<{ x: number; y: number }>({ x: defaultPosition.x, y: defaultPosition.y });
  const positionRef = useRef<PanelPosition>(defaultPosition);
  const isCollapsedRef = useRef(isCollapsed);
  const boundsRef = useRef(bounds);
  const defaultPosRef = useRef(defaultPosition);
  const rafIdRef = useRef<number | null>(null);

  // Keep refs synchronized without triggering re-runs
  positionRef.current = position;
  isCollapsedRef.current = isCollapsed;
  boundsRef.current = bounds;
  defaultPosRef.current = defaultPosition;

  // Hydrate from localStorage ONCE on mount (or if id changes)
  useEffect(() => {
    setIsHydrated(true);
    const stored = loadStoredLayout();
    const targetPos = stored[id] || defaultPosRef.current;

    const panelEl = panelRef.current;
    const width = panelEl?.offsetWidth || 360;
    const height = panelEl?.offsetHeight || 200;
    const clamped = clampPosition(
      targetPos,
      { width, height },
      { width: window.innerWidth, height: window.innerHeight },
      boundsRef.current
    );

    setPosition(clamped);
    positionRef.current = clamped;

    if (targetPos.isCollapsed !== undefined) {
      setIsCollapsed(targetPos.isCollapsed);
      isCollapsedRef.current = targetPos.isCollapsed;
    }
  }, [id]);

  // Handle browser window resize clamping (only when NOT actively dragging)
  useEffect(() => {
    const handleResize = () => {
      if (isDraggingRef.current) return;
      const panelEl = panelRef.current;
      if (!panelEl) return;
      const width = panelEl.offsetWidth;
      const height = panelEl.offsetHeight;
      const clamped = clampPosition(
        positionRef.current,
        { width, height },
        { width: window.innerWidth, height: window.innerHeight },
        boundsRef.current
      );
      if (clamped.x !== positionRef.current.x || clamped.y !== positionRef.current.y) {
        setPosition(clamped);
        positionRef.current = clamped;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Global layout reset event listener
  useEffect(() => {
    const handleGlobalReset = () => {
      if (isDraggingRef.current) return;
      const target = defaultPosRef.current;
      setPosition(target);
      positionRef.current = target;
      setIsCollapsed(target.isCollapsed ?? false);
      isCollapsedRef.current = target.isCollapsed ?? false;
    };

    window.addEventListener("hyperscaler:reset-hud-layout", handleGlobalReset);
    return () => window.removeEventListener("hyperscaler:reset-hud-layout", handleGlobalReset);
  }, []);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Pointer Events Level 3 Drag Handlers with RAF throttling & window event binding
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      // Only drag on primary mouse button or touch/pen
      if (e.button !== 0) return;

      // Don't drag if clicking an interactive control within the handle
      const target = e.target as HTMLElement;
      if (target.closest("button, a, input, select, textarea")) {
        return;
      }

      e.preventDefault();

      const pointerId = e.pointerId;
      const handleEl = e.currentTarget;
      try {
        handleEl.setPointerCapture(pointerId);
      } catch {
        // Fallback for environments lacking pointer capture
      }

      triggerHaptic("light");
      isDraggingRef.current = true;
      setIsDragging(true);

      dragStartRef.current = { pointerX: e.clientX, pointerY: e.clientY };
      panelStartPosRef.current = { x: positionRef.current.x, y: positionRef.current.y };

      const onPointerMove = (moveEvt: PointerEvent) => {
        if (!isDraggingRef.current) return;

        const dx = moveEvt.clientX - dragStartRef.current.pointerX;
        const dy = moveEvt.clientY - dragStartRef.current.pointerY;

        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(() => {
          if (!isDraggingRef.current) return;

          const tentative = {
            x: panelStartPosRef.current.x + dx,
            y: panelStartPosRef.current.y + dy,
            isCollapsed: isCollapsedRef.current,
          };

          const panelEl = panelRef.current;
          const width = panelEl?.offsetWidth || 360;
          const height = panelEl?.offsetHeight || 200;

          const clamped = clampPosition(
            tentative,
            { width, height },
            { width: window.innerWidth, height: window.innerHeight },
            boundsRef.current
          );

          positionRef.current = clamped;
          setPosition(clamped);
        });
      };

      const onPointerUp = (upEvt: PointerEvent) => {
        isDraggingRef.current = false;
        setIsDragging(false);

        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }

        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);

        try {
          if (handleEl.hasPointerCapture(pointerId)) {
            handleEl.releasePointerCapture(pointerId);
          }
        } catch {
          // Ignore pointer capture release error
        }

        triggerHaptic("light");

        // Save final position to localStorage
        const allStored = loadStoredLayout();
        allStored[id] = {
          x: positionRef.current.x,
          y: positionRef.current.y,
          isCollapsed: isCollapsedRef.current,
        };
        saveStoredLayout(allStored);
      };

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    },
    [id]
  );

  const toggleCollapse = useCallback(() => {
    triggerHaptic("light");
    setIsCollapsed((prev) => {
      const next = !prev;
      isCollapsedRef.current = next;
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
    const target = defaultPosRef.current;
    setPosition(target);
    positionRef.current = target;
    const allStored = loadStoredLayout();
    allStored[id] = target;
    saveStoredLayout(allStored);
  }, [id]);

  return {
    panelRef,
    position,
    isDragging,
    isCollapsed,
    isHydrated,
    dragHandleProps: {
      onPointerDown: handlePointerDown,
      style: { touchAction: "none" as const },
    },
    toggleCollapse,
    resetPosition,
  };
}
