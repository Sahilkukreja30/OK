const SESSION_KEY = 'cityreach_admin_session';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details ?? {};
  }
}

let onSessionExpired = () => {};
export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler;
};

const readSession = () => {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return session && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
};

export const hasSession = () => Boolean(readSession());

export const signOut = () => sessionStorage.removeItem(SESSION_KEY);

async function request(path, { method = 'GET', query, body } = {}) {
  const token = readSession()?.token;
  const url = `/api/admin/${path}${query ? `?${new URLSearchParams(query)}` : ''}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body && JSON.stringify(body)
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token) {
      signOut();
      onSessionExpired();
    }
    throw new ApiError(response.status, payload.error || 'Request failed.', payload.details);
  }
  return payload;
}

export async function signIn(password) {
  const session = await request('login', { method: 'POST', body: { password } });
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export const listEntries = (resource) => request('resource', { query: { resource } });
export const getEntry = (resource, id) => request('resource', { query: { resource, id } });
export const deleteEntry = (resource, id) => request('resource', { method: 'DELETE', query: { resource, id } });

export const saveEntry = (resource, { id, values, publish }) =>
  request('resource', { method: id ? 'PUT' : 'POST', body: { resource, id, values, publish } });

export const uploadImage = (payload) => request('upload', { method: 'POST', body: payload });
