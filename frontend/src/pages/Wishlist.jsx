import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { money } from '../utils.js';

export default function Wishlist() {
  const { items, remove } = useWishlist();
  const { add } = useCart();
  return <div className="container">
    <div className="catalog-heading"><div><span className="eyebrow">YOUR PERSONAL COLLECTION</span><h1>Saved items</h1></div><span className="muted">{items.length} saved</span></div>
    {!items.length ? <div className="empty-state"><div className="empty-icon">♡</div><h2>Your wishlist is waiting</h2><p className="muted">Save products you love and come back to them anytime.</p><Link className="btn" to="/">Explore products</Link></div> :
      <div className="grid">{items.map((item) => <article className="product-card" key={item.id}>
        <Link to={`/products/${item.id}`} className="product-image">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" /> : <div className="image-placeholder">No image</div>}</Link>
        <div className="product-body"><span className="muted small">{item.categoryName || 'Saved item'}</span><h3><Link to={`/products/${item.id}`}>{item.name}</Link></h3><div className="product-footer"><strong>{money(item.salePrice ?? item.price)}</strong><button className="btn btn-sm" onClick={() => add(item)}>Add to cart</button></div><button className="btn btn-ghost btn-sm" onClick={() => remove(item.id)}>Remove</button></div>
      </article>)}</div>}
  </div>;
}
