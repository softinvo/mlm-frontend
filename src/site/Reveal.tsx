import { CSSProperties, ElementType, ReactNode, useEffect, useRef, useState } from 'react';

/**
 * Fades and slides its content in the first time it scrolls into view. `delay` (ms) staggers neighbours.
 * Shows immediately when the browser can't observe scrolling or the visitor prefers reduced motion.
 */
export default function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }: { as?: ElementType; className?: string; delay?: number; children: ReactNode } & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined' || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches));
  useEffect(() => {
    if (seen || !ref.current) return;
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); } }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen]);
  return <Tag ref={ref} className={`reveal ${seen ? 'in' : ''} ${className}`} style={{ '--d': `${delay}ms` } as CSSProperties} {...rest}>{children}</Tag>;
}
