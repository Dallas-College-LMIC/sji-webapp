import { vi } from 'vitest';

// Mock jQuery and Select2
export const mockSelect2 = vi.fn().mockReturnThis();

export const mockJQuery = vi.fn((selector: any) => {
  const element = {
    find: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    append: vi.fn().mockReturnThis(),
    val: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    trigger: vi.fn(),
    select2: mockSelect2,
    length: 1,
    [0]: {} as HTMLElement,
  };
  return element;
});

// Make jQuery available globally
(globalThis as any).$ = mockJQuery;
(globalThis as any).jQuery = mockJQuery;