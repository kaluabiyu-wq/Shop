import { useEffect, useState } from 'react';
import * as api from '../api.js';
import { formatDate, money } from '../utils.js';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.orders
      .mine()
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, []);

  async function cancel(id) {
    setError('');
    try {
      const updated = await api.orders.cancel(id);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="container">
      <h1>My orders</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {!orders && !error && <p className="muted">Loading…</p>}
      {orders && orders.length === 0 && <p className="muted">You haven't placed any orders yet.</p>}

      <div className="stack">
        {orders?.map((o) => (
          <section className="order" key={o.id}>
            <header className="order-header">
              <div>
                <strong>Order #{o.id}</strong>
                <span className="muted small"> · {formatDate(o.createdAt)}</span>
              </div>
              <span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span>
            </header>
            <ul className="order-items">
              {o.items.map((i) => (
                <li key={i.productId}>
                  <span>
                    {i.quantity} × {i.productName}
                  </span>
                  <span>{money(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="order-delivery">
              <div><strong>{o.deliveryMethod === 'Pickup' ? 'Pickup from shop' : 'Delivery address'}</strong><p>{o.shippingAddress}</p></div>
              <div><strong>Courier contact</strong><p><a href={`tel:${o.phoneNumber}`}>{o.phoneNumber}</a></p></div>
              {o.mapUrl && <a className="btn btn-ghost btn-sm" href={o.mapUrl} target="_blank" rel="noreferrer">Open map pin ↗</a>}
              {o.deliveryMethod !== 'Pickup' && <p className="muted small">Delivery fee: {money(o.deliveryFee || 0)}</p>}
            </div>
            <footer className="order-footer">
              <span className="muted small">{o.deliveryMethod === 'Pickup' ? 'Collection: shop pickup' : `Landmark: ${o.landmark || '—'}`}</span>
              <div className="row">
                <strong>{money(o.total)}</strong>
                {o.status === 'Pending' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => cancel(o.id)}>
                    Cancel order
                  </button>
                )}
              </div>
            </footer>
          </section>
        ))}
      </div>
    </div>
  );
}
