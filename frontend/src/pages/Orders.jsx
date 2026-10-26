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
            <footer className="order-footer">
              <span className="muted small">Ship to: {o.shippingAddress}</span>
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
