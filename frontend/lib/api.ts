// All requests go through /api/[...path] — a Next.js server-side proxy.
// The actual backend URL (API_URL) is read server-side only and never exposed to the browser.
// For local development, the proxy forwards to http://localhost:5000.

const base = (path: string) => path.startsWith('/api/') || path === '/api' ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;

export const api = {
  get: async (path: string, token?: string) => {
    const res = await fetch(base(path), {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    return res.json();
  },

  post: async (path: string, body: any, token?: string) => {
    const res = await fetch(base(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },

  delete: async (path: string, token?: string) => {
    const res = await fetch(base(path), {
      method: 'DELETE',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    return res.json();
  },

  sendAIChatMessage: async (message: string, contextCollegeIds?: (number | string)[]) => {
    return api.post('/api/ai/chat', { message, contextCollegeIds });
  },

  getAISuggestions: async () => {
    return api.get('/api/ai/suggested-questions');
  },
};

export default api;
