import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import { money } from '../utils.js';

export default function Compare() {
  const comparison = useCompare();
  const { add } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!comparison.ids.length) { setProducts([]); return undefined; }
    setLoading(true); setError('');
    Promise.all(comparison.ids.map((id) => api.products.get(id).catch(() => null)))
      .then((results) => {
        if (cancelled) return;
        const found = results.filter(Boolean);
        setProducts(found);
        if (found.length !== results.length) setError('Some compared products are no longer available. You can remove them from this comparison.');
      })
      .catch(() => { if (!cancelled) setError('Could not load products. Please try again.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [comparison.ids]);

  if (!comparison.count) return <div className="container"><section className="empty-state"><div className="empty-icon">⇄</div><h1>Compare products</h1><p className="muted">Compare up to four products side by side to make a confident choice.</p><Link className="btn" to="/">Browse products</Link></section></div>;

  return <div className="container compare-page">
    <div className="catalog-heading"><div><h1>Compare products</h1><p className="muted small">Compare prices, availability and product details side by side.</p></div><button className="btn btn-ghost btn-sm" onClick={comparison.clear}>Clear all</button></div>
    {error && <div className="alert alert-error" role="status">{error}</div>}
    {loading ? <p className="muted" role="status">Loading comparison…</p> : products.length === 0 ? <p className="muted">No products could be loaded. <Link to="/">Browse the catalogue</Link>.</p> : <div className="compare-table-wrap"><table className="compare-table"><tbody>
      <tr><th scope="row">Product</th>{products.map((p) => <td key={p.id}><div className="compare-product"><Link to={`/products/${p.id}`}>{p.imageUrl ? <img src={p.imageUrl} alt={p.name} loading="lazy" /> : <div className="image-placeholder">No image</div>}</Link><Link className="compare-product-name" to={`/products/${p.id}`}>{p.name}</Link><button className="btn btn-ghost btn-sm" onClick={() => comparison.remove(p.id)}>Remove</button></div></td>)}</tr>
      <tr><th scope="row">Price</th>{products.map((p) => { const price = p.salePrice != null && Number(p.salePrice) < Number(p.price) ? p.salePrice : p.price; return <td key={p.id}><strong>{money(price)}</strong>{Number(price) < Number(p.price) && <div><del className="regular-price">{money(p.price)}</del></div>}</td>; })}</tr>
      <tr><th scope="row">Category</th>{products.map((p) => <td key={p.id}>{p.categoryName || '—'}</td>)}</tr>
      <tr><th scope="row">Availability</th>{products.map((p) => <td key={p.id}><span className={p.stock > 0 ? 'compare-in-stock' : 'compare-out-stock'}>{p.stock > 0 ? `In stock (${p.stock})` : 'Out of stock'}</span></td>)}</tr>
      <tr><th scope="row">Description</th>{products.map((p) => <td key={p.id}>{p.description || 'No description provided.'}</td>)}</tr>
      <tr><th scope="row">Action</th>{products.map((p) => <td key={p.id}><button className="btn btn-sm" disabled={p.stock < 1} onClick={() => add(p, 1)}>{p.stock < 1 ? 'Sold out' : 'Add to cart'}</button></td>)}</tr>
    </tbody></table></div>}
    {comparison.count < 4 && <p className="muted small compare-hint">You can compare {4 - comparison.count} more product{4 - comparison.count === 1 ? '' : 's'}. Add products using the Compare button in the catalogue.</p>}
  </div>;
}
