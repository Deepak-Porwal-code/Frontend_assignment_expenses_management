const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 500, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

function notifyUnauthorized() {
  window.dispatchEvent(new Event('moneta:unauthorized'));
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/**
 * Small fetch wrapper: JSON in, JSON out, cookies included.
 * On a 401 we broadcast an event so the auth provider can sign the user out.
 */
export async function api(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    signal,
    skipAuthEvent = false,
  } = options;

  const requestHeaders = { ...headers };
  const isFormData = body instanceof FormData;

  if (body && !isFormData) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: requestHeaders,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(
      0,
      'We couldn’t reach the server. Check your connection and try again.',
    );
  }

  if (response.status === 204) return null;

  const payload = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401 && !skipAuthEvent) {
      notifyUnauthorized();
    }
    throw new ApiError(
      payload?.message || 'Something went wrong. Please try again.',
      response.status,
      payload?.errors || [],
    );
  }

  return payload;
}

/** Downloads the filtered transaction CSV and returns the filename used. */
export async function downloadTransactionsCsv(filters = {}) {
  const response = await fetch(`${BASE_URL}/transactions/export.csv${buildQuery(filters)}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await parseResponse(response);
    throw new ApiError(payload?.message || 'Could not export your transactions.', response.status);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match ? match[1] : 'moneta-transactions.csv';

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return filename;
}

/** Fetches a protected attachment as a blob and opens it in a new tab. */
export async function openAttachment(transactionId) {
  const response = await fetch(`${BASE_URL}/transactions/${transactionId}/attachment`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await parseResponse(response);
    throw new ApiError(payload?.message || 'Could not open this attachment.', response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export { buildQuery };
