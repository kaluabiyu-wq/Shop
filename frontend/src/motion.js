import { useCallback, useEffect, useRef } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Pointer-driven 3D tilt. Attach `ref` and spread `handlers` on an element.
 * Sets CSS variables --tilt-x / --tilt-y (deg) and --mx / --my (% pointer position)
 * that the stylesheet uses for rotation, glare and zoom origin.
 */
export function useTilt(max = 8) {
  const ref = useRef(null);
  const raf = useRef(0);

  const onPointerMove = useCallback((e) => {
    if (prefersReducedMotion() || e.pointerType === 'touch') return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (clientX - r.left) / r.width;
      const y = (clientY - r.top) / r.height;
      el.style.setProperty('--tilt-x', `${((0.5 - y) * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--tilt-y', `${((x - 0.5) * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    });
  }, [max]);

  const onPointerLeave = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '50%');
  }, []);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return { ref, handlers: { onPointerMove, onPointerLeave } };
}

/** Animates a copy of the product image flying (and spinning in 3D) into the cart link in the navbar. */
export function flyToCart(sourceEl) {
  try {
    if (prefersReducedMotion()) return;
    const target = document.querySelector('[data-cart-target]');
    const img = sourceEl?.closest?.('article, .detail, .rec-tilt')?.querySelector('img');
    if (!target || !img || !img.animate) return;

    const from = img.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (!from.width || !from.height) return;

    const clone = img.cloneNode(false);
    clone.removeAttribute('loading');
    Object.assign(clone.style, {
      position: 'fixed', left: `${from.left}px`, top: `${from.top}px`,
      width: `${from.width}px`, height: `${from.height}px`,
      objectFit: 'cover', margin: '0', zIndex: '9999', pointerEvents: 'none',
      borderRadius: '14px', boxShadow: '0 18px 40px rgba(0,0,0,.25)', transformOrigin: 'center',
    });
    document.body.appendChild(clone);

    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const scale = Math.max(0.05, 26 / from.width);

    const anim = clone.animate(
      [
        { transform: 'translate(0,0) scale(1) rotateY(0deg)', opacity: 1, borderRadius: '14px', offset: 0 },
        { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 70}px) scale(${Math.max(0.55, scale * 4)}) rotateY(180deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotateY(360deg)`, opacity: 0.25, borderRadius: '50%', offset: 1 },
      ],
      { duration: 800, easing: 'cubic-bezier(.45,.05,.55,.95)' }
    );
    anim.onfinish = () => clone.remove();
    anim.oncancel = () => clone.remove();
  } catch { /* the animation is decorative; never block adding to cart */ }
}
