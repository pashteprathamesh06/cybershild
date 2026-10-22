/**
 * CyberShield AI — API client
 * Thin wrapper around fetch() that attaches the JWT, handles JSON,
 * and centralizes error handling.
 */
const API_BASE = '/api';

const CyberShieldAPI = (() => {
  function getToken() {
    return localStorage.getItem('cs_token');
  }

  function setSession(token, user) {
    if (!token) {
      throw new Error('Login response did not include a token');
    }
    localStorage.setItem('cs_token', token);
    localStorage.setItem('cs_user', JSON.stringify(user || {}));
  }

  function clearSession() {
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_user');
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('cs_user') || 'null');
    } catch {
      return null;
    }
  }

  async function request(path, { method = 'GET', body, isForm = false, headers = {} } = {}) {
    const token = getToken();
    const finalHeaders = { ...headers };
    if (!isForm) finalHeaders['Content-Type'] = 'application/json';
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: finalHeaders,
        cache: 'no-store', // <-- ADD THIS LINE
        body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      });
    } catch (networkErr) {
      throw new Error('Network error — please check your connection and try again.');
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      if (res.status === 401 && path !== '/auth/login') {
        clearSession();
        if (!window.location.pathname.endsWith('login.html')) {
          window.location.href = 'login.html';
        }
      }
      const message = data.message || `Request failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.errors = data.errors;
      throw err;
    }

    return data;
  }

  return {
    getToken,
    setSession,
    clearSession,
    getUser,
    get: (path) => request(path, { method: 'GET' }),
    post: (path, body) => request(path, { method: 'POST', body }),
    patch: (path, body) => request(path, { method: 'PATCH', body }),
    del: (path) => request(path, { method: 'DELETE' }),
    postForm: (path, formData) => request(path, { method: 'POST', body: formData, isForm: true }),
  };
})();
