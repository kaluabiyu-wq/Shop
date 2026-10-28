import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { money } from '../utils.js';

const SUBCITIES = ['Addis Ketema', 'Akaky Kaliti', 'Arada', 'Bole', 'Gullele', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 'Yeka', 'Lemi Kura'];
const REGIONAL_CITIES = ['Adama', 'Hawassa', 'Bahir Dar', 'Dire Dawa', 'Gondar', 'Jimma', 'Mekelle', 'Dessie', 'Other'];
const ADDIS_FEES = { 'Addis Ketema': 120, 'Akaky Kaliti': 180, Arada: 120, Bole: 150, Gullele: 150, Kirkos: 120, 'Kolfe Keranio': 180, Lideta: 120, 'Nifas Silk-Lafto': 180, Yeka: 150, 'Lemi Kura': 180 };
const REGIONAL_FEE = 350;
const FREE_SHIPPING_THRESHOLD = 3000;

export default function Cart() {
  const { items, savedItems, setQuantity, syncProduct, markUnavailable, remove, clear, total, saveForLater, moveToCart, removeSaved } = useCart();
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
  const [validationError, setValidationError] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationAttempt, setValidationAttempt] = useState(0);
  const productIds = items.map((item) => item.productId).join(',');
  const baseDeliveryFee = useMemo(() => deliveryMethod === 'Pickup' ? 0 : areaType === 'Addis' ? (ADDIS_FEES[subcity] ?? 180) : REGIONAL_FEE, [deliveryMethod, areaType, subcity]);
  const freeShipping = deliveryMethod === 'Delivery' && total >= FREE_SHIPPING_THRESHOLD;
  const deliveryFee = freeShipping ? 0 : baseDeliveryFee;

  // Refresh prices and inventory from the API on cart entry. The checkout endpoint
  // independently revalidates stock and prices before creating an order.
  useEffect(() => {
    if (!productIds) { setValidationError(''); return; }
    let cancelled = false;
    setValidating(true);
    setValidationError('');
    Promise.all(items.map(async (item) => {
      try {
        const live = await api.products.get(item.productId);
        if (!cancelled) syncProduct(live);
      } catch (err) {
        if (!cancelled && err.status === 404) markUnavailable(item.productId);
        else if (!cancelled) setValidationError('Could not verify current prices and stock. Check your connection and retry before checkout.');
      }
    })).finally(() => { if (!cancelled) setValidating(false); });
    return () => { cancelled = true; };
    // Only revalidate when the set of cart products changes, not on quantity/price state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIds, validationAttempt]);

  async function changeQuantity(productId, requested) {
    setValidationError('');
    try {
      const live = await api.products.get(productId);
      syncProduct(live);
      if (live.stock < 1) { setValidationError(`${live.name} is out of stock and cannot be ordered.`); return; }
      if (requested > live.stock) setValidationError(`Only ${live.stock} of ${live.name} are currently available. Quantity was limited.`);
      setQuantity(productId, Math.max(1, Math.min(requested, live.stock)));
    } catch (err) {
      setValidationError(err.status === 404 ? 'This product is no longer available. Remove it from your cart.' : 'Could not verify stock. Please try again.');
    }
  }


  async function checkout(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (validating || validationError || items.some((item) => item.unavailable || item.stock < 1 || item.quantity > item.stock)) { setError('Please resolve stock or validation warnings before checkout.'); setBusy(false); return; }
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

  if (items.length === 0) return <div className="container"><h1>Your cart</h1><p className="muted">Your cart is empty.</p><Link to="/" className="btn">Browse products</Link>
    {savedItems.length > 0 && <section className="saved-section"><h2>Saved for later ({savedItems.length})</h2>{savedItems.map((item) => <div className="cart-row" key={item.productId}><img src={item.imageUrl || ''} alt="" className="cart-thumb"/><div className="cart-info"><Link to={`/products/${item.productId}`}>{item.name}</Link><span className="muted small">{money(item.price)} each {item.salePrice != null && item.regularPrice > item.price && <del className="regular-price">{money(item.regularPrice)}</del>}</span></div><button className="btn btn-sm" disabled={item.unavailable || item.stock < 1} onClick={() => moveToCart(item.productId)}>Move to cart</button><button className="btn btn-ghost btn-sm" onClick={() => removeSaved(item.productId)}>Remove</button></div>)}</section>}
  </div>;

  return <div className="container">
    <h1>Your cart</h1>
    <div className="cart-validation-row">
      {validating && <p className="muted" role="status">Checking current prices and stock…</p>}
      {validationError && <div className="alert alert-error" role="alert">{validationError} <button type="button" className="btn btn-ghost btn-sm" onClick={() => setValidationAttempt((n) => n + 1)}>Retry validation</button></div>}
      {items.some((item) => item.validationMessage) && items.filter((item) => item.validationMessage).map((item) => <div className="alert alert-error" key={item.productId}>{item.name}: {item.validationMessage}</div>)}
    </div>
    <div className="cart-layout">
      <div className="cart-items">{items.map((i) => <div className="cart-row" key={i.productId}>
        <img src={i.imageUrl || ''} alt="" className="cart-thumb" />
        <div className="cart-info"><Link to={`/products/${i.productId}`}>{i.name}</Link><span className="muted small">{money(i.price)} each {i.salePrice != null && i.regularPrice > i.price && <del className="regular-price">{money(i.regularPrice)}</del>}</span></div>
        <input type="number" min="1" max={i.stock || 1} value={i.quantity} disabled={i.unavailable || validating} onChange={(e) => changeQuantity(i.productId, Number(e.target.value) || 1)} aria-label={`Quantity for ${i.name}`} className="qty-input" />
        <strong className="cart-line-total">{money(i.price * i.quantity)}</strong>
        <div className="cart-actions"><button className="btn btn-ghost btn-sm" onClick={() => saveForLater(i.productId)}>Save for later</button><button className="btn btn-ghost btn-sm text-danger" onClick={() => remove(i.productId)}>Remove</button></div>
      </div>)}</div>

      <aside className="summary">
        <h2>Order summary</h2>
        <div className="shipping-progress" aria-live="polite">
          {deliveryMethod === 'Pickup' ? <strong>Pickup is always free.</strong> : freeShipping ? <strong>You've unlocked free delivery!</strong> : <><strong>{money(Math.max(0, FREE_SHIPPING_THRESHOLD - total))} away from free delivery</strong><p className="muted small">Spend {money(FREE_SHIPPING_THRESHOLD)} on products to qualify.</p></>}
          <div className="shipping-progress-track"><span style={{ width: `${Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)}%` }} /></div>
        </div>
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
          {freeShipping && <p className="muted small">Free delivery applied to orders of {money(FREE_SHIPPING_THRESHOLD)} or more.</p>}
          <div className="summary-row total-row"><span>Total</span><strong>{money(total + deliveryFee)}</strong></div>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn" disabled={busy || validating || !!validationError || items.some((item) => item.unavailable || item.stock < 1 || item.quantity > item.stock)}>{busy ? 'Placing order…' : validating ? 'Checking stock…' : 'Place order'}</button>
        </form> : <div className="stack"><p className="muted">Please log in to place your order.</p><Link to="/login" state={{ from: '/cart' }} className="btn">Log in to checkout</Link></div>}
      </aside>
    </div>
    {savedItems.length > 0 && <section className="saved-section"><h2>Saved for later ({savedItems.length})</h2>{savedItems.map((item) => <div className="cart-row" key={item.productId}><img src={item.imageUrl || ''} alt="" className="cart-thumb"/><div className="cart-info"><Link to={`/products/${item.productId}`}>{item.name}</Link><span className="muted small">{money(item.price)} each {item.salePrice != null && item.regularPrice > item.price && <del className="regular-price">{money(item.regularPrice)}</del>}</span></div><button className="btn btn-sm" disabled={item.unavailable || item.stock < 1} onClick={() => moveToCart(item.productId)}>Move to cart</button><button className="btn btn-ghost btn-sm" onClick={() => removeSaved(item.productId)}>Remove</button></div>)}</section>}
  </div>;
}
