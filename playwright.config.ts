import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/integration',
    fullyParallel: false,
    retries: process.env.CI ? 2 : 0,
    timeout: 30_000,
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
        trace: 'retain-on-failure'
    },
    webServer: process.env.E2E_BASE_URL
        ? undefined
        : {
              command:
                  'APP_URL=http://localhost:5173 BETTER_AUTH_URL=http://localhost:5173 BETTER_AUTH_SECRET=test-secret-test-secret-test-secret-test FIELD_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= NODE_ENV=test DEV_MODE=disabled pnpm dev --port 5173',
              port: 5173,
              reuseExistingServer: false,
              timeout: 60_000
          },
    projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }]
});
