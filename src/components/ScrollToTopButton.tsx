import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Kembali ke atas"
      className="fixed z-[70] right-3 sm:right-6 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] sm:bottom-6 rounded-full border border-border/70 glass p-2.5 sm:p-3 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
    >
      <ArrowUp size={16} />
    </button>
  );
}
