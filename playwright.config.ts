import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	webServer: {
		// In CI, `npm run build` runs as its own workflow step (see .github/workflows/ci.yml)
		// so the server just needs to start; running build and start chained in the same
		// shell invocation has been flaky in CI.
		command: process.env.CI ? 'npm run start' : 'npm run build && npm run start',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			PORT: '4173',
			HOST: '127.0.0.1'
		}
	},
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}',
	use: {
		baseURL: 'http://127.0.0.1:4173',
		trace: 'retain-on-failure'
	},
	projects: [
		{
			name: 'mobile-chrome',
			use: {
				...devices['Pixel 7'],
				launchOptions: {
					executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? undefined
				}
			}
		}
	]
});
