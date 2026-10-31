import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { money } from '../utils.js';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import { useState } from 'react';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const productId = product?.id ?? product?.Id ?? product?.productId ?? product?.ProductId;
  const validProductId = productId != null && String(productId).trim() !== '';
  const wishlist = useWishlist();
  const comparison = useCompare();
  const [compareMessage, setCompareMessage] = useState('');
  const isCompared = comparison.has(productId);
  const saved = validProductId && wishlist.has(productId);
  const soldOut = product.stock === 0;
  const onSale = product.salePrice != null && Number(product.salePrice) < Number(product.price);
  const discount = onSale ? Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100) : 0;

  return (
    <article className="product-card">
      <Link to={validProductId ? `/products/${encodeURIComponent(productId)}` : '/'} className="product-image">
        {onSale && <span className="sale-badge">-{discount}%</span>}
        {soldOut && <span className="stock-badge">Out of stock</span>}
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="image-placeholder">No image</div>
        )}
      </Link>
      <button type="button" className={`wishlist-toggle ${saved ? 'is-saved' : ''}`} aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`} aria-pressed={saved} onClick={() => validProductId && wishlist.toggle({ ...product, id: productId })}>{saved ? '♥' : '♡'}</button>
      <div className="product-body">
        <span className="muted small">{product.categoryName}</span>
        <h3>
          <Link to={validProductId ? `/products/${encodeURIComponent(productId)}` : '/'}>{product.name}</Link>
        </h3>
        <div className="product-footer">
          <div className="product-prices">
            <strong className={onSale ? 'sale-price' : ''}>{money(onSale ? product.salePrice : product.price)}</strong>
            {onSale && <del className="regular-price">{money(product.price)}</del>}
          </div>
          <button className="btn btn-sm" disabled={soldOut} onClick={() => validProductId && add({ ...product, id: productId }, 1)}>
            {soldOut ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
        <div className="product-card-extra">
          <button type="button" className={`btn btn-ghost btn-sm ${isCompared ? 'compare-selected' : ''}`} aria-pressed={isCompared} onClick={() => { if (!validProductId) { setCompareMessage('This product has no valid ID.'); return; } const result = comparison.toggle({ ...product, id: productId }); setCompareMessage(result.limitReached ? 'Compare up to 4 products.' : result.added ? 'Added to comparison.' : 'Removed from comparison.'); }}>{isCompared ? '✓ Comparing' : '⇄ Compare'}</button>
          {compareMessage && <span className="muted small" role="status">{compareMessage}</span>}
        </div>
      </div>
    </article>
  );
}
