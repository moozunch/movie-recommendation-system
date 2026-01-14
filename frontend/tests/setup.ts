import '@testing-library/jest-dom/vitest';

// Shim ResizeObserver for components relying on it in jsdom
class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

// Attach to global in test env without TypeScript suppression
(globalThis as any).ResizeObserver = (globalThis as any).ResizeObserver || ResizeObserverMock;
