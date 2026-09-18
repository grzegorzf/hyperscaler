import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  clampPosition,
  loadStoredLayout,
  saveStoredLayout,
  clearStoredLayout,
  STORAGE_KEY_HUD_LAYOUT,
} from "../src/lib/browser/draggableMath";

describe("Draggable HUD Math & Storage Engine", () => {
  describe("Viewport Boundary Clamping", () => {
    it("clamps position within horizontal and vertical bounds", () => {
      const panel = { width: 300, height: 200 };
      const viewport = { width: 1920, height: 1080 };

      // Normal within bounds
      const normal = clampPosition({ x: 500, y: 300 }, panel, viewport);
      assert.strictEqual(normal.x, 500);
      assert.strictEqual(normal.y, 300);

      // Clamped to left minX (12px)
      const clampLeft = clampPosition({ x: -100, y: 300 }, panel, viewport);
      assert.strictEqual(clampLeft.x, 12);

      // Clamped to top minY (64px) to preserve header clearance
      const clampTop = clampPosition({ x: 500, y: 10 }, panel, viewport);
      assert.strictEqual(clampTop.y, 64);

      // Clamped to right maxX (1920 - 300 - 12 = 1608px)
      const clampRight = clampPosition({ x: 2500, y: 300 }, panel, viewport);
      assert.strictEqual(clampRight.x, 1608);

      // Clamped to bottom maxY (1080 - 200 - 12 = 868px)
      const clampBottom = clampPosition({ x: 500, y: 1500 }, panel, viewport);
      assert.strictEqual(clampBottom.y, 868);
    });

    it("respects custom bounds overrides", () => {
      const panel = { width: 200, height: 100 };
      const viewport = { width: 1000, height: 800 };

      const clamped = clampPosition(
        { x: 50, y: 50 },
        panel,
        viewport,
        { minX: 100, maxX: 600, minY: 120, maxY: 500 }
      );

      assert.strictEqual(clamped.x, 100);
      assert.strictEqual(clamped.y, 120);
    });

    it("preserves isCollapsed flag during clamping", () => {
      const clamped = clampPosition(
        { x: 200, y: 200, isCollapsed: true },
        { width: 300, height: 50 },
        { width: 1920, height: 1080 }
      );
      assert.strictEqual(clamped.isCollapsed, true);
    });
  });

  describe("LocalStorage Persistence", () => {
    let mockStore: Record<string, string> = {};
    let originalWindow: any;

    beforeEach(() => {
      mockStore = {};
      originalWindow = (globalThis as any).window;
      (globalThis as any).window = {
        localStorage: {
          getItem: (key: string) => mockStore[key] ?? null,
          setItem: (key: string, val: string) => {
            mockStore[key] = val;
          },
          removeItem: (key: string) => {
            delete mockStore[key];
          },
        },
      };
    });

    afterEach(() => {
      if (originalWindow === undefined) {
        delete (globalThis as any).window;
      } else {
        (globalThis as any).window = originalWindow;
      }
    });

    it("saves and loads panel coordinates reliably", () => {
      const initial = {
        "cloud-cost-hud": { x: 1200, y: 80, isCollapsed: false },
        "telemetry-hud": { x: 1200, y: 350, isCollapsed: true },
      };

      const saved = saveStoredLayout(initial);
      assert.strictEqual(saved, true);

      const loaded = loadStoredLayout();
      assert.deepStrictEqual(loaded, initial);
    });

    it("handles corrupted or invalid JSON in storage gracefully", () => {
      mockStore[STORAGE_KEY_HUD_LAYOUT] = "INVALID_JSON{{{{";
      const loaded = loadStoredLayout();
      assert.deepStrictEqual(loaded, {});
    });

    it("clears stored layout cleanly", () => {
      mockStore[STORAGE_KEY_HUD_LAYOUT] = JSON.stringify({ "test": { x: 10, y: 20 } });
      const cleared = clearStoredLayout();
      assert.strictEqual(cleared, true);
      assert.strictEqual(mockStore[STORAGE_KEY_HUD_LAYOUT], undefined);
    });
  });
});
