const TOKEN_KEY = 'shop_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

function extractMessage(data) {
  if (!data) return null;
  if (data.errors) return Object.values(data.errors).flat().join(' ');
  return data.detail || data.title || null;
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(extractMessage(data) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const qs = (params) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const auth = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  me: () => request('/auth/me'),
};

export const categories = {
  list: () => request('/categories'),
};

function normalizeProduct(product) {
  if (!product || typeof product !== 'object') return product;
  // ASP.NET normally serializes DTO Id as `id`; accept common legacy/cased
  // variants too so a product link can never silently become /products/undefined.
  const id = product.id ?? product.Id ?? product.productId ?? product.ProductId;
  return id == null ? product : { ...product, id };
}

export const products = {
  list: async (params = {}) => {
    const result = await request(`/products${qs(params)}`);
    if (Array.isArray(result)) return result.map(normalizeProduct);
    return result && Array.isArray(result.items)
      ? { ...result, items: result.items.map(normalizeProduct) }
      : result;
  },
  get: (id) => {
    const safeId = String(id ?? '').trim();
    if (!/^\\d+$/.test(safeId) || Number(safeId) < 1) {
      const error = new Error('Invalid product ID. Please return to the catalogue and choose a product.');
      error.status = 400;
      return Promise.reject(error);
    }
    return request(`/products/${encodeURIComponent(safeId)}`).then(normalizeProduct);
  },
  create: (data) => request('/products', { method: 'POST', body: data }),
  update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
};

export const orders = {
  checkout: (data) => request('/orders', { method: 'POST', body: data }),
  mine: () => request('/orders/mine'),
  all: (status) => request(`/orders/all${qs({ status })}`),
  cancel: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),
  updateStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
};
