import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { money } from '../utils.js';

const VIEWED_KEY = 'shop_recently_viewed';

function readViewedIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(VIEWED_KEY) || '[]');
    return (Array.isArray(saved) ? saved : []).map(Number).filter((n) => Number.isInteger(n) && n > 0);
  } catch {
    return [];
  }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** A product card that tilts in 3D toward the pointer and shows a moving glare. */
function TiltCard({ product, active, onSelect }) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const ref = useRef(null);
  const frame = useRef(0);

  const onSale = product.salePrice != null && Number(product.salePrice) < Number(product.price);
  const discount = onSale ? Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100) : 0;
  const saved = wishlist.has(product.id);

  const handleMove = (e) => {
    if (prefersReducedMotion() || !ref.current) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (clientX - r.left) / r.width;
      const y = (clientY - r.top) / r.height;
      el.style.setProperty('--tilt-x', `${((0.5 - y) * 16).toFixed(2)}deg`);
      el.style.setProperty('--tilt-y', `${((x - 0.5) * 16).toFixed(2)}deg`);
      el.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`);
    });
  };

  const reset = () => {
    cancelAnimationFrame(frame.current);
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <div
      ref={ref}
      className={`rec-tilt ${active ? 'is-active' : ''}`}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      onClick={active ? undefined : onSelect}
    >
      <div className="rec-tilt-inner">
        <Link to={`/products/${product.id}`} className="rec-image" tabIndex={active ? 0 : -1} aria-label={`View ${product.name}`}>
          {onSale && <span className="sale-badge">-{discount}%</span>}
          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" draggable="false" /> : <div className="image-placeholder">No image</div>}
          <span className="rec-glare" aria-hidden="true" />
        </Link>
        <div className="rec-info">
          <span className="muted small">{product.categoryName}</span>
          <h3>{product.name}</h3>
          <div className="product-prices">
            <strong className={onSale ? 'sale-price' : ''}>{money(onSale ? product.salePrice : product.price)}</strong>
            {onSale && <del className="regular-price">{money(product.price)}</del>}
          </div>
          <div className="rec-actions">
            <button type="button" className="btn btn-sm" disabled={product.stock === 0 || !active} onClick={() => add(product, 1)}>
              {product.stock === 0 ? 'Sold out' : 'Add to cart'}
            </button>
            <button
              type="button"
              className={`wishlist-inline ${saved ? 'is-saved' : ''}`}
              disabled={!active}
              aria-pressed={saved}
              aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
              onClick={() => wishlist.toggle(product)}
            >
              {saved ? '♥' : '♡'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Recommended products shown as a 3D coverflow carousel.
 *  - `productId`  → "You may also like" (similar to this product)
 *  - otherwise    → "Recommended for you" (based on recently viewed + best-sellers)
 */
export default function Recommended({ productId, title, subtitle }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);
  const touchStart = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setIndex(0);
    const load = productId ? api.products.recommendations(productId, 8) : api.products.recommended(readViewedIds().slice(0, 10), 8);
    load
      .then((res) => !cancelled && setItems(res.filter((p) => p?.id != null)))
      .catch(() => !cancelled && setItems([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [productId]);

  // Animate the section in when it scrolls into view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setVisible(true); return undefined; }
    const obs = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, items.length]);

  const go = useCallback((dir) => {
    setIndex((i) => Math.min(items.length - 1, Math.max(0, i + dir)));
  }, [items.length]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };

  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStart.current = null;
  };

  if (loading || items.length === 0) return null;

  return (
    <section ref={sectionRef} className={`recommended ${visible ? 'is-visible' : ''}`} aria-label={title}>
      <div className="catalog-heading">
        <div>
          <h2><span className="rec-spark" aria-hidden="true">✦</span> {title}</h2>
          {subtitle && <p className="muted small rec-subtitle">{subtitle}</p>}
        </div>
        <span className="muted small">{index + 1} / {items.length}</span>
      </div>

      <div
        className="rec-stage"
        role="group"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button type="button" className="rec-nav rec-prev" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous recommendation">‹</button>
        <div className="rec-track">
          {items.map((p, i) => {
            const offset = i - index;
            const abs = Math.abs(offset);
            return (
              <div
                key={p.id}
                className="rec-slot"
                style={{
                  '--offset': offset,
                  '--abs': abs,
                  '--i': i,
                  zIndex: 100 - abs,
                  opacity: abs > 3 ? 0 : 1,
                  pointerEvents: abs > 3 ? 'none' : 'auto',
                }}
                aria-hidden={abs !== 0}
              >
                <TiltCard product={p} active={offset === 0} onSelect={() => setIndex(i)} />
              </div>
            );
          })}
        </div>
        <button type="button" className="rec-nav rec-next" onClick={() => go(1)} disabled={index === items.length - 1} aria-label="Next recommendation">›</button>
      </div>

      <div className="rec-dots" role="tablist" aria-label="Choose recommendation">
        {items.map((p, i) => (
          <button key={p.id} type="button" role="tab" aria-selected={i === index} aria-label={p.name} className={i === index ? 'is-on' : ''} onClick={() => setIndex(i)} />
        ))}
      </div>
    </section>
  );
}
