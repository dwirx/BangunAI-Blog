import { afterEach, describe, expect, it, vi } from "vitest";
import { createRafThrottle } from "@/lib/raf-throttle";

describe("createRafThrottle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("coalesces repeated calls into a single animation frame callback", () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    let nextFrameId = 1;

    Object.defineProperty(window, "requestAnimationFrame", {
      value: vi.fn((callback: FrameRequestCallback) => {
        const id = nextFrameId++;
        callbacks.set(id, callback);
        return id;
      }),
      writable: true,
    });

    Object.defineProperty(window, "cancelAnimationFrame", {
      value: vi.fn((id: number) => callbacks.delete(id)),
      writable: true,
    });

    const fn = vi.fn();
    const throttled = createRafThrottle(fn);

    throttled();
    throttled();
    throttled();

    expect(fn).not.toHaveBeenCalled();
    expect(callbacks.size).toBe(1);

    callbacks.values().next().value?.(16);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending frame before it runs", () => {
    const callbacks = new Map<number, FrameRequestCallback>();

    Object.defineProperty(window, "requestAnimationFrame", {
      value: vi.fn((callback: FrameRequestCallback) => {
        callbacks.set(1, callback);
        return 1;
      }),
      writable: true,
    });

    Object.defineProperty(window, "cancelAnimationFrame", {
      value: vi.fn((id: number) => callbacks.delete(id)),
      writable: true,
    });

    const fn = vi.fn();
    const throttled = createRafThrottle(fn);

    throttled();
    throttled.cancel();

    expect(callbacks.size).toBe(0);
    expect(fn).not.toHaveBeenCalled();
  });
});
