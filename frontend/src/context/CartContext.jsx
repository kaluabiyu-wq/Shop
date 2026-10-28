import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_KEY = 'shop_cart';
const SAVED_KEY = 'shop_saved_for_later';

function loadList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

const effectivePrice = (product) => Number(product.salePrice ?? product.price ?? 0);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadList(CART_KEY));
  const [savedItems, setSavedItems] = useState(() => loadList(SAVED_KEY));

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* storage may be unavailable */ }
  }, [items]);
  useEffect(() => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(savedItems)); } catch { /* storage may be unavailable */ }
  }, [savedItems]);

  const value = useMemo(() => {
    const add = (product, quantity = 1) => {
      const stock = Math.max(0, Number(product.stock ?? 0));
      if (stock < 1) return false;
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        const qty = Math.min((existing?.quantity ?? 0) + quantity, stock);
        if (qty < 1) return prev;
        const line = {
          productId: product.id,
          name: product.name,
          price: effectivePrice(product),
          regularPrice: Number(product.price ?? 0),
          salePrice: product.salePrice ?? null,
          imageUrl: product.imageUrl,
          stock,
          categoryId: product.categoryId,
          quantity: qty,
          unavailable: false,
        };
        return existing
          ? prev.map((i) => (i.productId === product.id ? line : i))
          : [...prev, line];
      });
      return true;
    };

    const setQuantity = (productId, quantity) => setItems((prev) => prev.map((i) => {
      if (i.productId !== productId) return i;
      return { ...i, quantity: Math.max(1, Math.min(Number(quantity) || 1, Math.max(1, i.stock))) };
    }));

    const syncProduct = (product) => setItems((prev) => prev.map((i) => {
      if (i.productId !== product.id) return i;
      const stock = Math.max(0, Number(product.stock ?? 0));
      return {
        ...i,
        name: product.name,
        price: effectivePrice(product),
        regularPrice: Number(product.price ?? 0),
        salePrice: product.salePrice ?? null,
        imageUrl: product.imageUrl,
        stock,
        categoryId: product.categoryId,
        quantity: stock > 0 ? Math.min(i.quantity, stock) : i.quantity,
        unavailable: stock === 0,
        validationMessage: stock === 0 ? 'Currently out of stock.' : (i.quantity > stock ? `Quantity adjusted to the ${stock} available.` : ''),
      };
    }));

    const markUnavailable = (productId) => setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, unavailable: true, validationMessage: 'This product is no longer available.' } : i));
    const remove = (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId));
    const clear = () => setItems([]);
    const saveForLater = (productId) => {
      const item = items.find((i) => i.productId === productId);
      if (!item) return;
      setSavedItems((saved) => saved.some((i) => i.productId === productId) ? saved : [...saved, item]);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    };
    const moveToCart = (productId) => {
      const item = savedItems.find((i) => i.productId === productId);
      if (!item) return;
      if (!item.unavailable && item.stock > 0) {
        setItems((cart) => {
          const existing = cart.find((i) => i.productId === productId);
          if (existing) return cart.map((i) => i.productId === productId ? { ...i, quantity: Math.min(existing.quantity + item.quantity, item.stock) } : i);
          return [...cart, { ...item, quantity: Math.min(item.quantity, item.stock) }];
        });
      }
      setSavedItems((prev) => prev.filter((i) => i.productId !== productId));
    };
    const removeSaved = (productId) => setSavedItems((prev) => prev.filter((i) => i.productId !== productId));

    return {
      items, savedItems, add, setQuantity, syncProduct, markUnavailable, remove, clear,
      saveForLater, moveToCart, removeSaved,
      count: items.reduce((n, i) => n + i.quantity, 0),
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    };
  }, [items, savedItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
