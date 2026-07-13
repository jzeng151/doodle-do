import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	use: { baseURL: 'http://localhost:4180' },
	webServer: {
		command: 'npm run build && npx vite preview --port 4180 --strictPort',
		port: 4180,
		reuseExistingServer: !process.env.CI
	}
});
