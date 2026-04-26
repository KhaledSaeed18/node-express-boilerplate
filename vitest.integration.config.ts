import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        // Vite sets BASE_URL='/' by default. Override here so the app sees BASE_URL='/api'.
        env: {
            BASE_URL: '/api',
        },
        include: ['tests/integration/**/*.test.ts'],
        globalSetup: 'tests/helpers/globalSetup.ts',
        setupFiles: ['tests/helpers/setup.ts'],
        testTimeout: 30_000,
        hookTimeout: 30_000,
        // Serialize test files to prevent concurrent mutations on the shared test DB
        fileParallelism: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            include: ['src/controllers/**', 'src/routes/**', 'src/middleware/**'],
            thresholds: {
                lines: 70,
                functions: 75,
                branches: 65,
                statements: 70,
            },
        },
    },
});
