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

export const products = {
  list: (params = {}) => request(`/products${qs(params)}`),
  get: (id) => request(`/products/${id}`),
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
