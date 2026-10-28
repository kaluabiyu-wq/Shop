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
    </div>
  );
}
