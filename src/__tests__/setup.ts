import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, vi } from 'vitest';

// Auto cleanup after each test
afterEach(() => {
  // Clear DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

// Mock browser APIs
beforeAll(() => {
  // Mock localStorage
  const localStorageMock: Storage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  global.localStorage = localStorageMock;

  // Mock console methods to avoid noise in tests
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
  };

  // Mock fetch
  global.fetch = vi.fn();

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
      reload: vi.fn(),
    },
    writable: true,
  });
});

// Reset all mocks after each test
afterEach(() => {
  vi.resetAllMocks();
  vi.clearAllMocks();
});