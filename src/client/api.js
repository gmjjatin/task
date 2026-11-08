const TOKEN_KEY = 'shoplite.token';
const USER_KEY = 'shoplite.user';

export function getSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    return token && user ? { token, user } : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  if (session) {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const session = getSession();
  const res = await fetch(path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let payload = {};
    try {
      payload = await res.json();
    } catch {
      payload = {};
    }
    const err = new Error(payload?.error?.message || 'Request failed');
    err.status = res.status;
    err.code = payload?.error?.code;
    err.retryAfter = Number(res.headers.get('Retry-After')) || null;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  async login(email, password) {
    const session = await request('/api/auth/login', { method: 'POST', body: { email, password } });
    saveSession(session);
    return session;
  },
  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      saveSession(null);
    }
  },
  getProducts() {
    return request('/api/products');
  },
  getOrders(page = 1) {
    return request(`/api/orders?page=${page}`);
  },
  checkout(items) {
    return request('/api/checkout', {
      method: 'POST',
      body: { items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })) },
    });
  },
};
