import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as api from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { money } from '../utils.js';
import ProductCard from '../components/ProductCard.jsx';

const WISHLIST_KEY = 'shop_wishlist';
const readWishlist = () => { try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; } catch { return []; } };
const reviewKey = (id) => `shop_reviews_${id}`;

export default function ProductDetail() {
  const { id } = useParams();
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const [wishlist, setWishlist] = useState(readWishlist);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    let cancelled = false;
    setProduct(null); setError(''); setQty(1);
    api.products.get(id).then(async (p) => {
      if (cancelled) return;
      setProduct(p);
      try {
        const result = await api.products.list({ categoryId: p.categoryId, page: 1, pageSize: 5, sort: 'newest' });
        if (!cancelled) setRelated(result.items.filter((item) => item.id !== p.id).slice(0, 4));
      } catch { if (!cancelled) setRelated([]); }
    }).catch((e) => { if (!cancelled) setError(e.status === 404 ? 'Product not found.' : e.message); });
    return () => { cancelled = true; };
  }, [id]);
  useEffect(() => { try { setReviews(JSON.parse(localStorage.getItem(reviewKey(id))) || []); } catch { setReviews([]); } }, [id]);

  if (error) return <div className="container"><div className="alert alert-error">{error}</div><Link to="/">← Back to products</Link></div>;
  if (!product) return <div className="container"><div className="skeleton skeleton-line short"/><div className="detail"><div className="skeleton skeleton-image detail-skeleton"/><div><div className="skeleton skeleton-line"/><div className="skeleton skeleton-line"/><div className="skeleton skeleton-line medium"/></div></div></div>;

  const soldOut = product.stock <= 0;
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
  const isSaved = wishlist.includes(product.id);
  function toggleWishlist() {
    const next = isSaved ? wishlist.filter((x) => x !== product.id) : [...wishlist, product.id];
    setWishlist(next); localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  }
  function submitReview(e) {
    e.preventDefault();
    if (!reviewText.trim()) return;
    const next = [{ rating: Number(rating), text: reviewText.trim(), date: new Date().toISOString() }, ...reviews].slice(0, 50);
    setReviews(next); localStorage.setItem(reviewKey(id), JSON.stringify(next)); setReviewText(''); setRating(5);
  }
  function handleAdd() { add(product, qty); setAdded(true); window.setTimeout(() => setAdded(false), 1500); }

  return <div className="container">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Products</Link><span> / </span><span>{product.categoryName}</span><span> / </span><span aria-current="page">{product.name}</span></nav>
    <div className="detail">
      <div><div className="detail-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="image-placeholder">No image available</div>}</div><div className="gallery-thumbnails"><button className="gallery-thumb active" aria-label="View product image">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : 'No image'}</button></div></div>
      <div className="detail-info"><span className="muted small">{product.categoryName}</span><h1>{product.name}</h1><div className="rating-line"><span className="stars">{average ? '★'.repeat(Math.round(average)) + '☆'.repeat(5 - Math.round(average)) : '☆☆☆☆☆'}</span><span className="muted small">{average ? `${average.toFixed(1)} (${reviews.length} local review${reviews.length === 1 ? '' : 's'})` : 'No reviews yet'}</span></div>
        <p className="price">{money(product.price)}</p><p className="detail-description">{product.description || 'A carefully selected piece from our collection.'}</p>
        <p className={soldOut ? 'text-danger stock-indicator' : product.stock <= 3 ? 'stock-indicator stock-low' : 'stock-indicator stock-good'}>{soldOut ? '● Out of stock' : product.stock <= 3 ? `● Only ${product.stock} left in stock` : `● In stock (${product.stock} available)`}</p>
        {!soldOut && <div className="purchase-row"><div className="quantity-control"><button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((n) => Math.max(1, n - 1))}>−</button><span>{qty}</span><button type="button" aria-label="Increase quantity" disabled={qty >= product.stock} onClick={() => setQty((n) => Math.min(product.stock, n + 1))}>+</button></div><button className="btn" onClick={handleAdd}>{added ? 'Added to cart ✓' : 'Add to cart'}</button></div>}
        <button className="btn btn-ghost wishlist-btn" onClick={toggleWishlist}>{isSaved ? '♥ Saved to wishlist' : '♡ Add to wishlist'}</button><p className="muted small">Stock availability is checked again when you place your order.</p>
      </div>
    </div>
    <section className="reviews-section"><div className="section-heading"><div><p className="eyebrow">CUSTOMER FEEDBACK</p><h2>Reviews & ratings</h2></div><strong>{average ? `${average.toFixed(1)} / 5` : 'No rating yet'}</strong></div>
      <form className="review-form" onSubmit={submitReview}><label>Your rating <select value={rating} onChange={(e) => setRating(Number(e.target.value))}><option value={5}>★★★★★ — Excellent</option><option value={4}>★★★★☆ — Good</option><option value={3}>★★★☆☆ — Average</option><option value={2}>★★☆☆☆ — Fair</option><option value={1}>★☆☆☆☆ — Poor</option></select></label><label>Your review <textarea required maxLength={500} rows={3} value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share what you think about this product" /></label><button className="btn btn-sm" disabled={!reviewText.trim()}>Submit review</button><p className="muted small">Reviews are saved in this browser for now; they are not verified or shared with other customers.</p></form>
      {reviews.length > 0 && <div className="review-list">{reviews.map((r, i) => <article className="review-item" key={`${r.date}-${i}`}><div className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div><p>{r.text}</p><span className="muted small">{new Date(r.date).toLocaleDateString()}</span></article>)}</div>}
    </section>
    {related.length > 0 && <section className="related-section"><div className="section-heading"><div><p className="eyebrow">YOU MAY ALSO LIKE</p><h2>More from {product.categoryName}</h2></div><Link to={`/?categoryId=${product.categoryId}`}>Browse all →</Link></div><div className="grid">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div></section>}
  </div>;
}
