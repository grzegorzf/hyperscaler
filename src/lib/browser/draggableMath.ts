/**
 * Pure Mathematical & Storage Utilities for Draggable HUD Panels
 * 
 * Handles boundary clamping, viewport safety, and serialized layout persistence.
 */

export interface PanelPosition {
  x: number;
  y: number;
  isCollapsed?: boolean;
}

export interface PanelDimensions {
  width: number;
  height: number;
}

export interface ViewportDimensions {
  width: number;
  height: number;
}

export interface ClampingBounds {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

export const STORAGE_KEY_HUD_LAYOUT = "hyperscaler_hud_layout_v2";

/**
 * Clamps coordinates within viewport boundaries, preventing panels from escaping
 * the screen or sliding underneath the top header bar (minY = 64px).
 */
export function clampPosition(
  pos: PanelPosition,
  panel: PanelDimensions,
  viewport: ViewportDimensions,
  customBounds?: ClampingBounds
): PanelPosition {
  const minX = customBounds?.minX ?? 12;
  const minY = customBounds?.minY ?? 64; // Header height is 56px + 8px margin
  const maxX = customBounds?.maxX ?? Math.max(minX, viewport.width - panel.width - 12);
  const maxY = customBounds?.maxY ?? Math.max(minY, viewport.height - panel.height - 12);

  return {
    x: Math.round(Math.min(maxX, Math.max(minX, pos.x))),
    y: Math.round(Math.min(maxY, Math.max(minY, pos.y))),
    isCollapsed: pos.isCollapsed,
  };
}

/**
 * Safely loads persisted panel layout map from localStorage.
 */
export function loadStoredLayout(
  storageKey: string = STORAGE_KEY_HUD_LAYOUT
): Record<string, PanelPosition> {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};

    const validated: Record<string, PanelPosition> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (
        typeof value === "object" &&
        value !== null &&
        typeof (value as any).x === "number" &&
        typeof (value as any).y === "number"
      ) {
        validated[id] = {
          x: (value as any).x,
          y: (value as any).y,
          isCollapsed: Boolean((value as any).isCollapsed),
        };
      }
    }
    return validated;
  } catch {
    return {};
  }
}

/**
 * Persists updated panel coordinates map to localStorage.
 */
export function saveStoredLayout(
  positions: Record<string, PanelPosition>,
  storageKey: string = STORAGE_KEY_HUD_LAYOUT
): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(positions));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears stored layout to reset all panels to default docks.
 */
export function clearStoredLayout(
  storageKey: string = STORAGE_KEY_HUD_LAYOUT
): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
}
