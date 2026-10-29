import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const WishlistContext = createContext(null);
const KEY = 'shop_wishlist';

function readWishlist() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(readWishlist);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage may be unavailable */ }
  }, [items]);

  const value = useMemo(() => ({
    items,
    has: (id) => items.some((item) => String(item.id) === String(id)),
    toggle: (product) => setItems((prev) =>
      prev.some((item) => String(item.id) === String(product.id))
        ? prev.filter((item) => String(item.id) !== String(product.id))
        : [...prev, { id: product.id, name: product.name, price: product.price, salePrice: product.salePrice, imageUrl: product.imageUrl, categoryName: product.categoryName, categoryId: product.categoryId, stock: product.stock }]
    ),
    remove: (id) => setItems((prev) => prev.filter((item) => String(item.id) !== String(id))),
  }), [items]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
