import { vi } from 'vitest';

/**
 * Mock environment variables for testing
 * This prevents env.config.ts from throwing errors during test runs
 */
vi.stubEnv('INAVI_DOMAIN', 'https://dev-imaps.inavi.com');
vi.stubEnv('LOG_LEVEL', 'error');
