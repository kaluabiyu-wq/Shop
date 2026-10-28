import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as api from '../api.js';
import ProductCard from '../components/ProductCard.jsx';

const PAGE_SIZE = 8;

export default function Products() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState({ items: [], totalCount: 0, page: 1 });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState(() => searchParams.get('categoryId') || '');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { api.categories.list().then(setCategories).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const loadProducts = () => {
    setLoading(true); setError('');
    api.products.list({ q: query, categoryId, sort, page, pageSize: PAGE_SIZE })
      .then(setData).catch((e) => setError(e.message || 'Could not load products.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    api.products.list({ q: query, categoryId, sort, page, pageSize: PAGE_SIZE })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setError(e.message || 'Could not load products.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query, categoryId, sort, page]);
  const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE));

  return <div className="container">
    <div className="catalog-heading"><div><p className="eyebrow">FIND YOUR NEXT FAVORITE</p><h1>Shop products</h1><p className="muted">Explore the collection and find something made for you.</p></div><span className="muted small">{data.totalCount} items</span></div>
    <div className="filters">
      <input type="search" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
      <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} aria-label="Category"><option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Sort products"><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="name">Name: A–Z</option></select>
    </div>
    {error && <div className="alert alert-error" role="alert"><span>{error}</span> <button className="btn btn-sm btn-ghost" onClick={loadProducts}>Retry</button></div>}
    {loading ? <div className="grid" aria-label="Loading products">{Array.from({ length: 8 }, (_, i) => <div className="product-card skeleton-card" key={i}><div className="skeleton skeleton-image"/><div className="product-body"><div className="skeleton skeleton-line short"/><div className="skeleton skeleton-line"/><div className="skeleton skeleton-line medium"/></div></div>)}</div>
      : data.items.length === 0 ? <div className="empty-state"><span className="empty-icon">⌕</span><h2>No products found</h2><p className="muted">Try another search or clear the filters.</p><button className="btn btn-ghost" onClick={() => { setSearch(''); setQuery(''); setCategoryId(''); setSort('newest'); setPage(1); }}>Clear filters</button></div>
      : <><div className="grid">{data.items.map((p) => <ProductCard key={p.id} product={p} />)}</div><div className="pagination"><button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button><span className="muted">Page {page} of {totalPages}</span><button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button></div></>}
  </div>;
}
