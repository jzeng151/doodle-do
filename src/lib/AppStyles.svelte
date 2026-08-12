<style>
	:global(:root) {
		--paper: #f2efe6;
		--paper-2: #e9e5d9;
		--ink: #111111;
		--gray: #6a675f;
		--edge: #111111;
		--accent: #111111;
		--spot: #b52e2e;
		--onion-prev: #d04648;
		--onion-next: #6daa2c;
		--checker-light: #f7f4ec;
		--checker-dark: #ddd9ce;
		--checker-muted: #bbb7ad;
	}
	:global(body) {
		margin: 0;
		font-family: "Zen Kaku Gothic New", "Noto Sans", system-ui, sans-serif;
		font-size: 0.8125rem;
		background: var(--paper);
		color: var(--ink);
	}
	:global(button) {
		min-height: 32px;
		background: var(--paper);
		color: inherit;
		border: 2px solid var(--edge);
		border-radius: 0;
		padding: 0.3em 0.6em;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.75rem;
		font-weight: 700;
		line-height: 1.2;
		letter-spacing: 0.04em;
	}
	:global(button:hover:not(:disabled)) {
		background: var(--paper-2);
		color: var(--ink);
	}
	:global(button:disabled) {
		opacity: 0.4;
		cursor: default;
	}
	:global(button.active) {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--paper);
	}
	:global(input, select) {
		min-height: 28px;
		background: var(--paper);
		color: inherit;
		border: 2px solid var(--edge);
		border-radius: 0;
		padding: 0.25em 0.4em;
		font: inherit;
	}
	:global(:focus-visible) {
		outline: 3px solid var(--ink);
		outline-offset: 2px;
	}
	@media (pointer: coarse) {
		:global(button, input, select) { min-height: 44px; }
		:global(button) { min-width: 44px; }
	}
</style>
