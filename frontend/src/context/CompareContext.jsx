import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CompareContext = createContext(null);
const STORAGE_KEY = 'shop_compare_products';
const MAX_COMPARE = 4;

function readIds() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.map(Number).filter((id, i, all) => Number.isInteger(id) && id > 0 && all.indexOf(id) === i).slice(0, MAX_COMPARE) : [];
  } catch { return []; }
}

export function CompareProvider({ children }) {
  const [ids, setIds] = useState(readIds);
  const persist = useCallback((next) => {
    setIds(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Comparison still works for this session. */ }
  }, []);
  const has = useCallback((id) => ids.includes(Number(id)), [ids]);
  const toggle = useCallback((product) => {
    const id = Number(product.id);
    if (ids.includes(id)) { persist(ids.filter((current) => current !== id)); return { added: false }; }
    if (ids.length >= MAX_COMPARE) return { added: false, limitReached: true };
    persist([...ids, id]);
    return { added: true };
  }, [ids, persist]);
  const remove = useCallback((id) => persist(ids.filter((current) => current !== Number(id))), [ids, persist]);
  const clear = useCallback(() => persist([]), [persist]);
  const value = useMemo(() => ({ ids, count: ids.length, has, toggle, remove, clear }), [ids, has, toggle, remove, clear]);
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const value = useContext(CompareContext);
  if (!value) throw new Error('useCompare must be used inside CompareProvider');
  return value;
}
