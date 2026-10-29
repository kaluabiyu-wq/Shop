import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { money } from '../utils.js';
import { useWishlist } from '../context/WishlistContext.jsx';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const saved = wishlist.has(product.id);
  const soldOut = product.stock === 0;
  const onSale = product.salePrice != null && Number(product.salePrice) < Number(product.price);
  const discount = onSale ? Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100) : 0;

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-image">
        {onSale && <span className="sale-badge">-{discount}%</span>}
        {soldOut && <span className="stock-badge">Out of stock</span>}
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="image-placeholder">No image</div>
        )}
      </Link>
      <button type="button" className={`wishlist-toggle ${saved ? 'is-saved' : ''}`} aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`} aria-pressed={saved} onClick={() => wishlist.toggle(product)}>{saved ? '♥' : '♡'}</button>
      <div className="product-body">
        <span className="muted small">{product.categoryName}</span>
        <h3>
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="product-footer">
          <div className="product-prices">
            <strong className={onSale ? 'sale-price' : ''}>{money(onSale ? product.salePrice : product.price)}</strong>
            {onSale && <del className="regular-price">{money(product.price)}</del>}
          </div>
          <button className="btn btn-sm" disabled={soldOut} onClick={() => add(product, 1)}>
            {soldOut ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
