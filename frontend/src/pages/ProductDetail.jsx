import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as api from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { money } from '../utils.js';
import { rememberProduct } from '../components/RecentlyViewed.jsx';
import RecentlyViewed from '../components/RecentlyViewed.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const { add } = useCart();
  const wishlist = useWishlist();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setProduct(null);
    setError('');
    if (!id || !/^\d+$/.test(id) || Number(id) < 1) {
      setError('Invalid product link. Please return to the catalogue and choose a product.');
      return undefined;
    }
    let cancelled = false;
    api.products
      .get(id)
      .then((item) => {
        if (cancelled) return;
        if (!item?.id) { setError('Product data is incomplete. Please return to the catalogue.'); return; }
        setProduct(item);
        rememberProduct(item.id);
      })
      .catch((e) => { if (!cancelled) setError(e.status === 404 ? 'Product not found.' : e.message); });
    return () => { cancelled = true; };
  }, [id]);

  if (error)
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
        <Link to="/">← Back to products</Link>
      </div>
    );
  if (!product) return <p className="container muted">Loading…</p>;

  const soldOut = product.stock === 0;
  const onSale = product.salePrice != null && Number(product.salePrice) < Number(product.price);
  const discount = onSale ? Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100) : 0;

  function handleAdd() {
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="container">
      <Link to="/">← Back to products</Link>
      <div className="detail">
        <div className="detail-image">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="image-placeholder">No image</div>
          )}
        </div>
        <div>
          <span className="muted small">{product.categoryName}</span>
          <h1>{product.name}</h1>
          <div className="detail-price-block">
            <p className={`price ${onSale ? 'sale-price' : ''}`}>{money(onSale ? product.salePrice : product.price)}</p>
            {onSale && <><del className="regular-price detail-regular-price">{money(product.price)}</del><span className="sale-badge detail-discount">Save {discount}%</span></>}
          </div>
          <p>{product.description}</p>
          <button type="button" className={`btn btn-ghost detail-save ${wishlist.has(product.id) ? 'is-saved' : ''}`} onClick={() => wishlist.toggle(product)} aria-pressed={wishlist.has(product.id)}>{wishlist.has(product.id) ? '♥ Saved to wishlist' : '♡ Save to wishlist'}</button>
          <p className={soldOut ? 'text-danger' : product.stock <= 3 ? 'stock-low' : 'muted'}>
            {soldOut ? 'Out of stock' : product.stock <= 3 ? `Only ${product.stock} left in stock` : `${product.stock} in stock`}
          </p>
          <section className="product-policy" aria-label="Delivery and returns">
            <h3>Delivery estimate</h3>
            <p><strong>Addis Ababa:</strong> usually 1–3 business days after order confirmation.</p>
            <p><strong>Regional cities:</strong> usually 3–7 business days after order confirmation.</p>
            <p className="muted small">These are estimates; remote areas, holidays, and payment verification may affect delivery.</p>
            <h3>Returns</h3>
            <p>Contact support within 7 days of delivery to request a return. Items should be unused and in their original packaging; eligibility and refund arrangements must be confirmed by the shop.</p>
          </section>
          {!soldOut && (
            <div className="row">
              <input
                type="number"
                min="1"
                max={product.stock}
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, Math.min(Number(e.target.value) || 1, product.stock)))
                }
                aria-label="Quantity"
                className="qty-input"
              />
              <button className="btn" onClick={handleAdd}>
                {added ? 'Added ✓' : 'Add to cart'}
              </button>
            </div>
          )}
        </div>
      </div>
      <RecentlyViewed excludeId={product.id} />
    </div>
  );
}
