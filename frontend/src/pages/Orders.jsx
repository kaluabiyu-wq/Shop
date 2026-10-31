import { useEffect, useState } from 'react';
import * as api from '../api.js';
import { formatDate, money } from '../utils.js';
import { useCart } from '../context/CartContext.jsx';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [reordering, setReordering] = useState(null);
  const [notice, setNotice] = useState('');
  const cart = useCart();

  useEffect(() => {
    api.orders
      .mine()
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, []);

  async function reorder(order) {
    setError(''); setNotice(''); setReordering(order.id);
    let added = 0, unavailable = 0;
    try {
      for (const line of order.items || []) {
        try {
          const product = await api.products.get(line.productId);
          if (Number(product.stock ?? 0) > 0 && cart.add(product, Number(line.quantity) || 1)) added += 1;
          else unavailable += 1;
        } catch { unavailable += 1; }
      }
      setNotice(`${added} item${added === 1 ? '' : 's'} added to your cart${unavailable ? `; ${unavailable} unavailable or out of stock` : ''}.`);
    } finally { setReordering(null); }
  }

  function printReceipt(orderId) {
    document.body.dataset.printOrder = String(orderId);
    window.print();
    delete document.body.dataset.printOrder;
  }

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
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      {!orders && !error && <p className="muted">Loading…</p>}
      {orders && orders.length === 0 && <p className="muted">You haven't placed any orders yet.</p>}

      <div className="stack">
        {orders?.map((o) => (
          <section className={`order ${String(o.id) === String(window.document.body.dataset.printOrder) ? 'print-selected' : ''}`} key={o.id}>
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
              <div className="row order-actions">
                <strong>{money(o.total)}</strong>
                <button className="btn btn-ghost btn-sm" onClick={() => printReceipt(o.id)}>Print receipt</button>
                <button className="btn btn-primary btn-sm" onClick={() => reorder(o)} disabled={reordering === o.id}>
                  {reordering === o.id ? 'Adding…' : 'Buy again'}
                </button>
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
