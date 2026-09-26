/** Typed JSON fetch with an 8 s timeout. Throws on network errors, timeouts and non-2xx responses. */
export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), ...init, headers });
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${url} → ${response.status}`);
  return (await response.json()) as T;
}
