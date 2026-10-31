import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const WishlistContext = createContext(null);
const KEY = 'shop_wishlist';

function readWishlist() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    if (!Array.isArray(value)) return [];
    // Discard stale/corrupt entries from older builds that have no usable product ID.
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const id = item.id ?? item.Id ?? item.productId ?? item.ProductId;
        return id != null && String(id).trim() !== '' ? { ...item, id } : null;
      })
      .filter(Boolean)
      .filter((item, index, all) => all.findIndex((other) => String(other.id) === String(item.id)) === index);
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
    toggle: (product) => {
      const id = product?.id ?? product?.Id ?? product?.productId ?? product?.ProductId;
      if (id == null || String(id).trim() === '') return;
      setItems((prev) =>
      prev.some((item) => String(item.id) === String(id))
        ? prev.filter((item) => String(item.id) !== String(id))
        : [...prev, { id, name: product.name, price: product.price, salePrice: product.salePrice, imageUrl: product.imageUrl, categoryName: product.categoryName, categoryId: product.categoryId, stock: product.stock }]
      );
    },
    remove: (id) => setItems((prev) => prev.filter((item) => String(item.id) !== String(id))),
  }), [items]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
