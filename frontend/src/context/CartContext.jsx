import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_KEY = 'shop_cart';

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable: cart just won't persist */
    }
  }, [items]);

  const value = useMemo(() => {
    const add = (product, quantity = 1) =>
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        const qty = Math.min((existing?.quantity ?? 0) + quantity, product.stock);
        const line = {
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          stock: product.stock,
          quantity: qty,
        };
        return existing
          ? prev.map((i) => (i.productId === product.id ? line : i))
          : [...prev, line];
      });

    const setQuantity = (productId, quantity) =>
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) }
            : i
        )
      );

    const remove = (productId) =>
      setItems((prev) => prev.filter((i) => i.productId !== productId));

    const clear = () => setItems([]);

    return {
      items,
      add,
      setQuantity,
      remove,
      clear,
      count: items.reduce((n, i) => n + i.quantity, 0),
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
