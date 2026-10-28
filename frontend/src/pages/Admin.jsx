import { useCallback, useEffect, useState } from 'react';
import * as api from '../api.js';
import { formatDate, money } from '../utils.js';

const EMPTY = { name: '', description: '', price: '', salePrice: '', stock: '', imageUrl: '', categoryId: '' };
const STATUSES = ['Pending', 'Paid', 'Shipped', 'Delivered'];

export default function Admin() {
  const [tab, setTab] = useState('products');
  return (
    <div className="container">
      <h1>Admin</h1>
      <div className="tabs">
        <button className={tab === 'products' ? 'tab active' : 'tab'} onClick={() => setTab('products')}>
          Products
        </button>
        <button className={tab === 'orders' ? 'tab active' : 'tab'} onClick={() => setTab('orders')}>
          Orders
        </button>
      </div>
      {tab === 'products' ? <ProductsAdmin /> : <OrdersAdmin />}
    </div>
  );
}

function ProductsAdmin() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [bulkPercent, setBulkPercent] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.products.list({ pageSize: 50, sort: 'name' });
      setItems(res.items);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    api.categories.list().then(setCategories).catch(() => {});
  }, [load]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      salePrice: p.salePrice == null ? '' : String(p.salePrice),
      stock: String(p.stock),
      imageUrl: p.imageUrl || '',
      categoryId: String(p.categoryId),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      salePrice: form.salePrice === '' ? null : Number(form.salePrice),
      stock: Number(form.stock),
      imageUrl: form.imageUrl || null,
      categoryId: Number(form.categoryId),
    };
    try {
      if (editingId) await api.products.update(editingId, payload);
      else await api.products.create(payload);
      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function applyBulkPriceChange() {
    const percent = Number(bulkPercent);
    if (!Number.isFinite(percent) || percent <= -100 || percent > 1000) { setBulkMessage('Enter a percentage greater than -100 and no more than 1000.'); return; }
    if (!window.confirm(`Apply ${percent > 0 ? '+' : ''}${percent}% to all ${items.length} loaded products?`)) return;
    setBusy(true); setBulkMessage('');
    try {
      for (const product of items) { const nextPrice = Math.round(product.price * (1 + percent / 100) * 100) / 100; await api.products.update(product.id, { name: product.name, description: product.description, price: nextPrice, stock: product.stock, imageUrl: product.imageUrl || null, categoryId: product.categoryId, salePrice: product.salePrice != null && product.salePrice < nextPrice ? product.salePrice : null }); }
      setBulkMessage(`Updated prices for ${items.length} products.`); await load();
    } catch (err) { setBulkMessage(`Bulk update stopped: ${err.message}. Some earlier products may already have been updated.`); await load(); }
    finally { setBusy(false); }
  }

  async function remove(p) {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    setError('');
    try {
      await api.products.remove(p.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <form className="admin-form" onSubmit={submit}>
        <h2>{editingId ? 'Edit product' : 'New product'}</h2>
        <div className="form-grid">
          <label>
            Name
            <input required maxLength={200} value={form.name} onChange={set('name')} />
          </label>
          <label>
            Category
            <select required value={form.categoryId} onChange={set('categoryId')}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Price (ETB)
            <input required type="number" min="0.01" step="0.01" value={form.price} onChange={set('price')} />
          </label>
          <label>
            Sale price (ETB, optional)
            <input type="number" min="0.01" step="0.01" max={form.price || undefined} value={form.salePrice} onChange={set('salePrice')} placeholder="Leave blank for no sale" />
          </label>
          <label>
            Stock
            <input required type="number" min="0" step="1" value={form.stock} onChange={set('stock')} />
          </label>
          <label className="span-2">
            Image URL
            <input type="url" value={form.imageUrl} onChange={set('imageUrl')} />
          </label>
          <label className="span-2">
            Description
            <textarea rows={3} maxLength={2000} value={form.description} onChange={set('description')} />
          </label>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="row">
          <button className="btn" disabled={busy}>
            {editingId ? 'Save changes' : 'Add product'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="admin-form stack">
        <h2>Bulk price adjustment (ETB)</h2>
        <p className="muted small">Apply a percentage increase or decrease to the products currently loaded (up to 50). Back up prices first; this updates products sequentially.</p>
        <div className="row"><input type="number" step="0.1" min="-99.9" max="1000" value={bulkPercent} onChange={(e) => setBulkPercent(e.target.value)} placeholder="e.g. 15 for +15%" /><button type="button" className="btn" disabled={busy || !items.length || bulkPercent === ''} onClick={applyBulkPriceChange}>Apply to loaded products</button></div>
        {bulkMessage && <p role="status">{bulkMessage}</p>}
      </section>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Sale price</th>
              <th>Stock</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.categoryName}</td>
                <td>{money(p.price)}</td>
                <td>{p.salePrice == null ? '—' : money(p.salePrice)}</td>
                <td>{p.stock}</td>
                <td className="actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button className="btn btn-ghost btn-sm text-danger" onClick={() => remove(p)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OrdersAdmin() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.orders
      .all()
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, []);

  const replace = (updated) =>
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

  async function changeStatus(id, status) {
    setError('');
    try {
      replace(await api.orders.updateStatus(id, status));
    } catch (e) {
      setError(e.message);
    }
  }

  async function cancel(id) {
    setError('');
    try {
      replace(await api.orders.cancel(id));
    } catch (e) {
      setError(e.message);
    }
  }

  if (!orders && !error) return <p className="muted">Loading…</p>;

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Delivery / contact</th>
              <th>Total</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders?.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.customerEmail}</td>
                <td>{formatDate(o.createdAt)}</td>
                <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td className="delivery-admin-cell">
                  <strong>{o.deliveryMethod === 'Pickup' ? 'Shop pickup' : `${o.subcity || o.regionalCity || ''}${o.woreda ? ` · Woreda ${o.woreda}` : ''}`}</strong>
                  <div>{o.phoneNumber}</div>
                  {o.landmark && <div>{o.landmark}</div>}
                  {o.mapUrl && <a href={o.mapUrl} target="_blank" rel="noreferrer">Open map pin ↗</a>}
                  <div>Payment: {o.paymentMethod} {o.paymentTransactionId ? `· Ref ${o.paymentTransactionId}` : ''}</div>
                  {o.paymentProofDataUrl && <a href={o.paymentProofDataUrl} target="_blank" rel="noreferrer">View payment screenshot ↗</a>}
                  <div className="muted small">{o.paymentVerified ? 'Payment verified' : 'Payment not yet verified'}</div>
                  {o.deliveryFee > 0 && <div className="muted small">Fee: {money(o.deliveryFee)}</div>}
                </td>
                <td>{money(o.total)}</td>
                <td>
                  {o.status === 'Cancelled' ? (
                    <span className="status status-cancelled">Cancelled</span>
                  ) : (
                    <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}>
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="actions">
                  {o.status === 'Pending' && (
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => cancel(o.id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders?.length === 0 && <p className="muted">No orders yet.</p>}
    </>
  );
}
