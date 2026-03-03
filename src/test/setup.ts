import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock ethers BrowserProvider
vi.mock('ethers', () => ({
  ethers: {
    BrowserProvider: vi.fn().mockImplementation(() => ({
      send: vi.fn().mockResolvedValue([]),
      getSigner: vi.fn().mockResolvedValue({
        getAddress: vi.fn().mockResolvedValue('0xTestAddress1234567890123456789012345678'),
        signMessage: vi.fn().mockResolvedValue('0xMockSignature'),
      }),
    })),
  },
}))

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  value: {
    request: vi.fn().mockResolvedValue(['0xTestAddress1234567890123456789012345678']),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  writable: true,
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver — must be a real class (constructor)
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver
