import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
		url: 'http://127.0.0.1:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
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
