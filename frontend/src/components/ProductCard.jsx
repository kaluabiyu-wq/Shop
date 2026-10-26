import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { money } from '../utils.js';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const soldOut = product.stock === 0;

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="image-placeholder">No image</div>
        )}
      </Link>
      <div className="product-body">
        <span className="muted small">{product.categoryName}</span>
        <h3>
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="product-footer">
          <strong>{money(product.price)}</strong>
          <button className="btn btn-sm" disabled={soldOut} onClick={() => add(product, 1)}>
            {soldOut ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
