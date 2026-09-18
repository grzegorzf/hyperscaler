import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  isBrowser,
  supportsVibration,
  supportsWakeLock,
  supportsCompressionStream,
  triggerHaptic,
  requestWakeLock,
  releaseWakeLock,
  isWakeLockActive,
  subscribeWakeLock,
  compressGzip,
} from "../src/lib/browser/webApis";
import { safeStartViewTransition } from "../src/lib/browser/viewTransitions";

describe("Native Web APIs & Feature Detectors", () => {
  it("detects SSR environment safely without errors", () => {
    // In node environment without window/document mocks, isBrowser returns false
    assert.strictEqual(typeof isBrowser(), "boolean");
    assert.strictEqual(typeof supportsVibration(), "boolean");
    assert.strictEqual(typeof supportsWakeLock(), "boolean");
    assert.strictEqual(typeof supportsCompressionStream(), "boolean");
  });

  describe("Tactile Haptics (Vibration API)", () => {
    let originalNavigator: any;
    let originalWindow: any;
    let originalDocument: any;

    beforeEach(() => {
      originalNavigator = (globalThis as any).navigator;
      originalWindow = (globalThis as any).window;
      originalDocument = (globalThis as any).document;
    });

    afterEach(() => {
      delete (globalThis as any).window;
      delete (globalThis as any).document;
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
      if (originalWindow !== undefined) (globalThis as any).window = originalWindow;
      if (originalDocument !== undefined) (globalThis as any).document = originalDocument;
    });

    it("safely returns false when vibration is not supported", () => {
      (globalThis as any).window = {};
      (globalThis as any).document = {};
      Object.defineProperty(globalThis, "navigator", {
        value: {},
        configurable: true,
        writable: true,
      });
      const result = triggerHaptic("light");
      assert.strictEqual(result, false);
    });

    it("triggers correct vibration cadence when supported", () => {
      let vibrationArg: any = null;
      (globalThis as any).window = {};
      (globalThis as any).document = {};
      Object.defineProperty(globalThis, "navigator", {
        value: {
          vibrate: (pattern: any) => {
            vibrationArg = pattern;
            return true;
          },
        },
        configurable: true,
        writable: true,
      });

      // Light pattern (12ms)
      assert.strictEqual(triggerHaptic("light"), true);
      assert.strictEqual(vibrationArg, 12);

      // Medium pattern (25ms)
      assert.strictEqual(triggerHaptic("medium"), true);
      assert.strictEqual(vibrationArg, 25);

      // Heavy pattern (45ms)
      assert.strictEqual(triggerHaptic("heavy"), true);
      assert.strictEqual(vibrationArg, 45);

      // Chaos alarm pattern ([40, 60, 40, 80, 100])
      assert.strictEqual(triggerHaptic("chaos"), true);
      assert.deepStrictEqual(vibrationArg, [40, 60, 40, 80, 100]);
    });
  });

  describe("Screen Wake Lock API", () => {
    let originalNavigator: any;
    let originalWindow: any;
    let originalDocument: any;

    beforeEach(() => {
      originalNavigator = (globalThis as any).navigator;
      originalWindow = (globalThis as any).window;
      originalDocument = (globalThis as any).document;
    });

    afterEach(() => {
      delete (globalThis as any).window;
      delete (globalThis as any).document;
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
      if (originalWindow !== undefined) (globalThis as any).window = originalWindow;
      if (originalDocument !== undefined) (globalThis as any).document = originalDocument;
    });

    it("returns false safely when wakeLock is unavailable", async () => {
      (globalThis as any).window = {};
      (globalThis as any).document = {};
      Object.defineProperty(globalThis, "navigator", {
        value: {},
        configurable: true,
        writable: true,
      });
      const success = await requestWakeLock();
      assert.strictEqual(success, false);
      assert.strictEqual(isWakeLockActive(), false);
    });

    it("manages wake lock lifecycle and subscriber notifications", async () => {
      let released = false;
      const releaseCallbacks: (() => void)[] = [];

      const mockSentinel = {
        get released() {
          return released;
        },
        release: async () => {
          released = true;
          releaseCallbacks.forEach((cb) => cb());
        },
        addEventListener: (event: string, cb: () => void) => {
          if (event === "release") releaseCallbacks.push(cb);
        },
      };

      (globalThis as any).window = {};
      (globalThis as any).document = {};
      Object.defineProperty(globalThis, "navigator", {
        value: {
          wakeLock: {
            request: async (type: string) => {
              assert.strictEqual(type, "screen");
              released = false;
              return mockSentinel;
            },
          },
        },
        configurable: true,
        writable: true,
      });

      const states: boolean[] = [];
      const unsubscribe = subscribeWakeLock((active) => {
        states.push(active);
      });

      // Initial state from subscription
      assert.strictEqual(states[states.length - 1], false);

      // Request lock
      const acquired = await requestWakeLock();
      assert.strictEqual(acquired, true);
      assert.strictEqual(isWakeLockActive(), true);
      assert.strictEqual(states[states.length - 1], true);

      // Release lock
      const releasedOk = await releaseWakeLock();
      assert.strictEqual(releasedOk, true);
      assert.strictEqual(isWakeLockActive(), false);
      assert.strictEqual(states[states.length - 1], false);

      unsubscribe();
    });
  });

  describe("Native Web Streams GZIP Compression", () => {
    it("compresses text using browser/node CompressionStream", async () => {
      const sampleText =
        "# Hyperscaler Architecture Spec\n".repeat(50) +
        "Enterprise Multi-Cloud FinOps Benchmark\n".repeat(30);

      const result = await compressGzip(sampleText);

      assert.ok(result.originalBytes > 0, "Original bytes should be > 0");
      assert.ok(result.compressedBytes > 0, "Compressed bytes should be > 0");
      assert.ok(
        result.compressedBytes < result.originalBytes,
        "GZIP compressed bytes should be strictly smaller than original"
      );
      assert.ok(result.ratioPercent > 50, "Compression ratio should exceed 50% for repetitive text");
      assert.ok(result.blob instanceof Blob, "Result should contain a standard Blob");
    });
  });

  describe("View Transitions Safe Wrapper", () => {
    let originalWindow: any;
    let originalDocument: any;

    beforeEach(() => {
      originalWindow = (globalThis as any).window;
      originalDocument = (globalThis as any).document;
    });

    afterEach(() => {
      delete (globalThis as any).window;
      delete (globalThis as any).document;
      if (originalWindow !== undefined) (globalThis as any).window = originalWindow;
      if (originalDocument !== undefined) (globalThis as any).document = originalDocument;
    });

    it("executes the callback synchronously when view transitions are absent", () => {
      let executed = false;
      safeStartViewTransition(() => {
        executed = true;
      });
      assert.strictEqual(executed, true);
    });

    it("delegates to document.startViewTransition when available", () => {
      let passedToStart = false;

      (globalThis as any).window = {
        matchMedia: () => ({ matches: false }),
      };
      (globalThis as any).document = {
        startViewTransition: (cb: () => void) => {
          passedToStart = true;
          cb();
        },
      };

      let executed = false;
      safeStartViewTransition(() => {
        executed = true;
      });

      assert.strictEqual(passedToStart, true);
      assert.strictEqual(executed, true);
    });
  });
});
