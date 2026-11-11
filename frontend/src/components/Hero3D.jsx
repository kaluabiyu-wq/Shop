import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api.js';
import { useTilt } from '../motion.js';

const CARD_W = 112;

/** A rotating 3D ring of product photos with pointer parallax. Falls back to floating shapes. */
export default function Hero3D() {
  const [items, setItems] = useState([]);
  const { ref, handlers } = useTilt(10);

  useEffect(() => {
    let cancelled = false;
    api.products
      .list({ page: 1, pageSize: 12, sort: 'newest' })
      .then((res) => {
        const list = (res?.items ?? []).filter((p) => p.imageUrl && p.id != null).slice(0, 8);
        if (!cancelled) setItems(list);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const n = items.length;
  const radius = n >= 3 ? Math.round(CARD_W / (2 * Math.tan(Math.PI / n))) + 24 : 0;

  return (
    <div className="hero3d" ref={ref} {...handlers} aria-label="Featured products">
      <span className="hero-orb orb-a" aria-hidden="true" />
      <span className="hero-orb orb-b" aria-hidden="true" />
      <span className="hero-orb orb-c" aria-hidden="true" />
      {n >= 3 ? (
        <div className="ring-stage">
          <div className="ring" style={{ '--n': n }}>
            {items.map((p, i) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="ring-item"
                style={{ transform: `rotateY(${(360 / n) * i}deg) translateZ(${radius}px)` }}
                aria-label={p.name}
                tabIndex={-1}
              >
                <img src={p.imageUrl} alt="" draggable="false" loading="lazy" />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="hero-mark" aria-hidden="true">✦</div>
      )}
    </div>
  );
}
