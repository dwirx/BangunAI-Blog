import { useEffect, useState } from "react";
import { createRafThrottle } from "@/lib/raf-throttle";

export function useReadingProgress(enabled: boolean = true) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setProgress(0);
      return;
    }

    const updateProgress = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      setProgress((current) => (current === nextProgress ? current : nextProgress));
    };

    const throttledUpdate = createRafThrottle(updateProgress);
    updateProgress();

    window.addEventListener("scroll", throttledUpdate, { passive: true });
    window.addEventListener("resize", throttledUpdate);

    return () => {
      throttledUpdate.cancel();
      window.removeEventListener("scroll", throttledUpdate);
      window.removeEventListener("resize", throttledUpdate);
    };
  }, [enabled]);

  return progress;
}
