import { vi } from 'vitest';

/**
 * Creates a mock localStorage implementation
 */
export function createMockLocalStorage(): Storage {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock fetch response
 */
export function createFetchResponse<T>(data: T, options: Partial<Response> = {}): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    clone: () => createFetchResponse(data, options),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic',
    url: '',
    ...options,
  } as Response;
}

/**
 * Create a mock fetch error response
 */
export function createFetchErrorResponse(
  message: string = 'Network error',
  status: number = 500
): Response {
  return createFetchResponse(
    { error: message },
    {
      ok: false,
      status,
      statusText: message,
    }
  );
}

/**
 * Setup mock fetch with predefined responses
 */
export function setupMockFetch(responses: Map<string, Response>): void {
  vi.mocked(global.fetch).mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Find matching response
    for (const [pattern, response] of responses) {
      if (url.includes(pattern)) {
        return response;
      }
    }
    
    // Default to 404
    return createFetchErrorResponse('Not found', 404);
  });
}