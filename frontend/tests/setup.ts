import '@testing-library/jest-dom/vitest';

// Shim ResizeObserver for components relying on it in jsdom
class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

// @ts-expect-error - attach to global for tests
global.ResizeObserver = global.ResizeObserver || ResizeObserverMock;
