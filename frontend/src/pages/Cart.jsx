import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { money } from '../utils.js';

export default function Cart() {
  const { items, setQuantity, remove, clear, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function checkout(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.orders.checkout({
        shippingAddress: address,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      clear();
      navigate('/orders');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0)
    return (
      <div className="container">
        <h1>Your cart</h1>
        <p className="muted">Your cart is empty.</p>
        <Link to="/" className="btn">
          Browse products
        </Link>
      </div>
    );

  return (
    <div className="container">
      <h1>Your cart</h1>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((i) => (
            <div className="cart-row" key={i.productId}>
              <img src={i.imageUrl || ''} alt="" className="cart-thumb" />
              <div className="cart-info">
                <Link to={`/products/${i.productId}`}>{i.name}</Link>
                <span className="muted small">{money(i.price)} each</span>
              </div>
              <input
                type="number"
                min="1"
                max={i.stock}
                value={i.quantity}
                onChange={(e) => setQuantity(i.productId, Number(e.target.value) || 1)}
                aria-label={`Quantity for ${i.name}`}
                className="qty-input"
              />
              <strong className="cart-line-total">{money(i.price * i.quantity)}</strong>
              <button className="btn btn-ghost" onClick={() => remove(i.productId)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <aside className="summary">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>

          {user ? (
            <form onSubmit={checkout} className="stack">
              <label>
                Shipping address
                <textarea
                  required
                  minLength={5}
                  maxLength={300}
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>
              {error && <div className="alert alert-error">{error}</div>}
              <button className="btn" disabled={busy}>
                {busy ? 'Placing order…' : 'Place order'}
              </button>
            </form>
          ) : (
            <div className="stack">
              <p className="muted">Please log in to place your order.</p>
              <Link to="/login" state={{ from: '/cart' }} className="btn">
                Log in to checkout
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
