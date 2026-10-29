import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api.js';
import ProductCard from './ProductCard.jsx';

const KEY = 'shop_recently_viewed';

export function rememberProduct(productId) {
  try {
    const current = JSON.parse(localStorage.getItem(KEY) || '[]');
    const ids = [Number(productId), ...(Array.isArray(current) ? current.map(Number) : [])]
      .filter((id, index, all) => Number.isInteger(id) && id > 0 && all.indexOf(id) === index)
      .slice(0, 6);
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch { /* Browsing should still work when storage is unavailable. */ }
}

export default function RecentlyViewed({ excludeId }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    let ids = [];
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      ids = (Array.isArray(saved) ? saved : []).map(Number).filter((id) => id !== Number(excludeId)).slice(0, 4);
    } catch { ids = []; }
    Promise.all(ids.map((id) => api.products.get(id).catch(() => null))).then((items) => {
      if (!cancelled) setProducts(items.filter(Boolean));
    });
    return () => { cancelled = true; };
  }, [excludeId]);

  if (!products.length) return null;
  return <section className="recently-viewed">
    <div className="catalog-heading"><h2>Recently viewed</h2><Link to="/">Browse all products →</Link></div>
    <div className="grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
  </section>;
}
