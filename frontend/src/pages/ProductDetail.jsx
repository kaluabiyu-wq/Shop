import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as api from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { money } from '../utils.js';

export default function ProductDetail() {
  const { id } = useParams();
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setProduct(null);
    setError('');
    api.products
      .get(id)
      .then(setProduct)
      .catch((e) => setError(e.status === 404 ? 'Product not found.' : e.message));
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
          <p className="price">{money(product.price)}</p>
          <p>{product.description}</p>
          <p className={soldOut ? 'text-danger' : 'muted'}>
            {soldOut ? 'Out of stock' : `${product.stock} in stock`}
          </p>
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
    </div>
  );
}
