import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { money } from '../utils.js';

const SUBCITIES = ['Addis Ketema', 'Akaky Kaliti', 'Arada', 'Bole', 'Gullele', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 'Yeka', 'Lemi Kura'];
const REGIONAL_CITIES = ['Adama', 'Hawassa', 'Bahir Dar', 'Dire Dawa', 'Gondar', 'Jimma', 'Mekelle', 'Dessie', 'Other'];
const ADDIS_FEES = { 'Addis Ketema': 120, 'Akaky Kaliti': 180, Arada: 120, Bole: 150, Gullele: 150, Kirkos: 120, 'Kolfe Keranio': 180, Lideta: 120, 'Nifas Silk-Lafto': 180, Yeka: 150, 'Lemi Kura': 180 };
const REGIONAL_FEE = 350;

export default function Cart() {
  const { items, setQuantity, remove, clear, total } = useCart();
  const [stockChecking, setStockChecking] = useState({});
  const [stockErrors, setStockErrors] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deliveryMethod, setDeliveryMethod] = useState('Delivery');
  const [areaType, setAreaType] = useState('Addis');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subcity, setSubcity] = useState('Bole');
  const [regionalCity, setRegionalCity] = useState('Adama');
  const [woreda, setWoreda] = useState('');
  const [landmark, setLandmark] = useState('');
  const [directions, setDirections] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Telebirr');
  const [paymentTransactionId, setPaymentTransactionId] = useState('');
  const [paymentProofDataUrl, setPaymentProofDataUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const deliveryFee = useMemo(() => deliveryMethod === 'Pickup' ? 0 : areaType === 'Addis' ? (ADDIS_FEES[subcity] ?? 180) : REGIONAL_FEE, [deliveryMethod, areaType, subcity]);

  async function checkout(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api.orders.checkout({
        deliveryMethod, phoneNumber, paymentMethod, paymentTransactionId: paymentTransactionId || null, paymentProofDataUrl: paymentProofDataUrl || null,
        shippingAddress: deliveryMethod === 'Pickup' ? 'Pickup from shop' : `${areaType === 'Addis' ? `Addis Ababa, ${subcity}, Woreda ${woreda}` : regionalCity}, ${landmark}`,
        subcity: deliveryMethod === 'Delivery' && areaType === 'Addis' ? subcity : null,
        woreda: deliveryMethod === 'Delivery' && areaType === 'Addis' ? woreda : null,
        regionalCity: deliveryMethod === 'Delivery' && areaType === 'Regional' ? regionalCity : null,
        landmark: deliveryMethod === 'Delivery' ? landmark : null,
        directions: deliveryMethod === 'Delivery' ? directions : null,
        mapUrl: deliveryMethod === 'Delivery' ? mapUrl : null,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      clear(); navigate('/orders');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function changeQuantity(item, requested) {
    const quantity = Math.max(1, Math.min(Number(requested) || 1, item.stock));
    setStockChecking((prev) => ({ ...prev, [item.productId]: true }));
    setStockErrors((prev) => ({ ...prev, [item.productId]: '' }));
    try {
      const fresh = await api.products.get(item.productId);
      if (fresh.stock < 1) { remove(item.productId); setStockErrors((prev) => ({ ...prev, [item.productId]: 'This item is now out of stock and was removed.' })); return; }
      if (quantity > fresh.stock) setStockErrors((prev) => ({ ...prev, [item.productId]: `Stock updated. Maximum available is ${fresh.stock}.` }));
      setQuantity(item.productId, Math.min(quantity, fresh.stock));
    } catch (err) {
      setStockErrors((prev) => ({ ...prev, [item.productId]: `Could not verify stock: ${err.message}. Try again.` }));
    } finally { setStockChecking((prev) => ({ ...prev, [item.productId]: false })); }
  }

  if (items.length === 0) return <div className="container empty-state"><span className="empty-icon">🛍</span><h1>Your cart is empty</h1><p className="muted">Looks like you haven’t found your favorites yet.</p><Link to="/" className="btn">Browse products</Link></div>;

  return <div className="container">
    <div className="cart-title-row"><div><p className="eyebrow">YOUR SELECTION</p><h1>Your cart</h1><p className="muted">{items.reduce((n, i) => n + i.quantity, 0)} item(s) in your cart</p></div><button className="btn btn-ghost" onClick={() => { if (window.confirm('Remove all items from your cart?')) clear(); }}>Clear cart</button></div>
    <div className="cart-layout">
      <div className="cart-items">{items.map((i) => <div className="cart-row" key={i.productId}>
        <Link to={`/products/${i.productId}`}><img src={i.imageUrl || ''} alt={i.name} className="cart-thumb" /></Link>
        <div className="cart-info"><Link to={`/products/${i.productId}`}>{i.name}</Link><span className="muted small">{money(i.price)} each</span><span className="muted small">{i.stock} available</span></div>
        <div className="cart-quantity"><div className="quantity-control"><button type="button" disabled={i.quantity <= 1 || stockChecking[i.productId]} aria-label={`Decrease ${i.name}`} onClick={() => changeQuantity(i, i.quantity - 1)}>−</button><span>{stockChecking[i.productId] ? '…' : i.quantity}</span><button type="button" disabled={i.quantity >= i.stock || stockChecking[i.productId]} aria-label={`Increase ${i.name}`} onClick={() => changeQuantity(i, i.quantity + 1)}>+</button></div>{stockErrors[i.productId] && <span className="stock-error">{stockErrors[i.productId]}</span>}</div>
        <strong className="cart-line-total">{money(i.price * i.quantity)}</strong>
        <button className="btn btn-ghost" onClick={() => remove(i.productId)}>Remove</button>
      </div>)}</div>

      <aside className="summary">
        <h2>Order summary</h2>
        <div className="summary-row"><span>Items subtotal</span><strong>{money(total)}</strong></div>
        {user ? <form onSubmit={checkout} className="stack">
          <label>Phone number for courier <input required type="tel" maxLength={30} placeholder="e.g. 0911 234 567" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></label>
          <fieldset className="delivery-options"><legend>How would you like to receive your order?</legend>
            <label className="choice"><input type="radio" name="deliveryMethod" checked={deliveryMethod === 'Delivery'} onChange={() => setDeliveryMethod('Delivery')} /> Deliver to me</label>
            <label className="choice"><input type="radio" name="deliveryMethod" checked={deliveryMethod === 'Pickup'} onChange={() => setDeliveryMethod('Pickup')} /> Pickup from shop (free)</label>
          </fieldset>
          {deliveryMethod === 'Delivery' && <>
            <label>Delivery area <select value={areaType} onChange={(e) => setAreaType(e.target.value)}><option value="Addis">Addis Ababa — subcity</option><option value="Regional">Regional city</option></select></label>
            {areaType === 'Addis' ? <>
              <label>Subcity <select required value={subcity} onChange={(e) => setSubcity(e.target.value)}>{SUBCITIES.map((s) => <option key={s}>{s}</option>)}</select></label>
              <label>Woreda <input required maxLength={100} placeholder="Enter woreda number/name" value={woreda} onChange={(e) => setWoreda(e.target.value)} /></label>
            </> : <label>Regional city <select required value={regionalCity} onChange={(e) => setRegionalCity(e.target.value)}>{REGIONAL_CITIES.map((s) => <option key={s}>{s}</option>)}</select></label>}
            <label>Landmark <input required maxLength={200} placeholder="e.g. near Bole Medhanialem Church" value={landmark} onChange={(e) => setLandmark(e.target.value)} /></label>
            <label>Extra directions (optional) <textarea rows={2} maxLength={500} placeholder="Building, floor, gate colour, nearby shop…" value={directions} onChange={(e) => setDirections(e.target.value)} /></label>
            <label>Google Maps link (optional) <input type="url" maxLength={1000} placeholder="Paste your shared Google Maps link" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} /></label>
            <p className="muted small">In Google Maps, tap your location or drop a pin, then choose Share and paste the link above.</p>
          </>}
          <fieldset className="delivery-options"><legend>Manual payment (order stays pending until admin confirms)</legend>
            <label>Payment method <select required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option>Telebirr</option><option>CBE Birr</option><option>Bank Transfer</option></select></label>
            <label>Transaction ID (optional if screenshot supplied) <input maxLength={100} value={paymentTransactionId} onChange={(e) => setPaymentTransactionId(e.target.value)} placeholder="Enter payment reference" /></label>
            <label>Payment screenshot (optional if transaction ID supplied) <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (!file) { setPaymentProofDataUrl(''); return; } if (file.size > 5 * 1024 * 1024) { setError('Payment screenshot must be under 5 MB.'); e.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => setPaymentProofDataUrl(String(reader.result)); reader.readAsDataURL(file); }} /></label>
            <p className="muted small">Pay using the shop’s official payment details, then submit the transaction ID or screenshot. Admin must verify payment before marking the order Paid.</p>
          </fieldset>
          <div className="summary-row"><span>Delivery fee</span><strong>{deliveryFee === 0 ? 'Free' : money(deliveryFee)}</strong></div>
          <div className="summary-row total-row"><span>Total</span><strong>{money(total + deliveryFee)}</strong></div>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn" disabled={busy}>{busy ? 'Placing order…' : 'Place order'}</button>
        </form> : <div className="stack"><p className="muted">Please log in to place your order.</p><Link to="/login" state={{ from: '/cart' }} className="btn">Log in to checkout</Link></div>}
      </aside>
    </div>
  </div>;
}
