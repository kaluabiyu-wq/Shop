import { useEffect, useState } from 'react';
import * as api from '../api.js';
import ProductCard from '../components/ProductCard.jsx';

const PAGE_SIZE = 8;

export default function Products() {
  const [data, setData] = useState({ items: [], totalCount: 0, page: 1 });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {});
  }, []);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.products
      .list({ q: query, categoryId, sort, page, pageSize: PAGE_SIZE })
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, categoryId, sort, page]);

  const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE));

  return (
    <div className="container">
      <section className="shop-hero">
        <div><span className="eyebrow">MADE TO BE DISCOVERED</span><h1>Find something you love.</h1><p>Explore clothing, accessories, and handcrafted Ethiopian style.</p></div>
        <div className="hero-mark" aria-hidden="true">✦</div>
      </section>
      <div className="catalog-heading"><h2>Shop all products</h2><span className="muted small">{loading ? 'Updating catalogue…' : `${data.totalCount} item${data.totalCount === 1 ? '' : 's'}`}</span></div>

      <div className="filters">
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
        />
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          aria-label="Sort"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="muted">Loading products…</p>
      ) : data.items.filter((p) => !inStockOnly || Number(p.stock) > 0).length === 0 ? (
        <p className="muted">No products match your search.</p>
      ) : (
        <div className="grid">
          {data.items.filter((p) => !inStockOnly || Number(p.stock) > 0).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {!loading && data.items.length > 0 && <p className="muted small results-note">Showing {data.items.length} of {data.totalCount} products · Prices and availability may change.</p>}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Previous
          </button>
          <span className="muted">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-ghost"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
