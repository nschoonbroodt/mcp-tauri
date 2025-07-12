import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        testTimeout: 60000,
        hookTimeout: 60000,
        globalSetup: './tests/globalSetup.ts',
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true
            }
        },
    },
});