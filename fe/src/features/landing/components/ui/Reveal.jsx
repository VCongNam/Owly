import { useEffect, useRef, useState } from "react";

/**
 * Fades children in once they enter the viewport. Opacity only —
 * nothing bounces, nothing overshoots. Honors prefers-reduced-motion.
 */
export default function Reveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`${className} transition-opacity duration-700 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </Tag>
  );
}
