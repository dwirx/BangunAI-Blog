type AnyFunction = (...args: never[]) => void;

type RafThrottled<T extends AnyFunction> = ((...args: Parameters<T>) => void) & {
  cancel: () => void;
};

export function createRafThrottle<T extends AnyFunction>(callback: T): RafThrottled<T> {
  let frameId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = ((...args: Parameters<T>) => {
    lastArgs = args;

    if (frameId !== null) {
      return;
    }

    frameId = window.requestAnimationFrame(() => {
      frameId = null;
      const nextArgs = lastArgs;
      lastArgs = null;

      if (nextArgs) {
        callback(...nextArgs);
      }
    });
  }) as RafThrottled<T>;

  throttled.cancel = () => {
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
    }

    frameId = null;
    lastArgs = null;
  };

  return throttled;
}
