// Offline support (§4.7/§5): cache the production shell after the first load,
// then fill optional routes on demand. Navigations stay network-first so an
// online reload does not serve an older app shell.
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `doodledo-${version}`;
const BASE = sw.location.pathname.split('/').slice(0, -1).join('/');
const ROOT = `${BASE}/`;
const CANVAS = `${BASE}/canvas`;
const IMMUTABLE = `${BASE}/_app/immutable/`;
const WORKERS = build.filter((path) => path.includes('/workers/'));

async function cacheShell(cache: Cache): Promise<void> {
	const responses = await Promise.all([ROOT, CANVAS].map((path) => fetch(path, { cache: 'reload' })));
	if (responses.some((response) => !response.ok)) throw new Error('App shell request failed');
	const linked = (
		await Promise.all(
			responses.map(async (response) => {
				const html = await response.clone().text();
				return [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
					.map((match) => new URL(match[1], response.url))
					.filter((url) => url.origin === sw.location.origin && url.pathname.startsWith(IMMUTABLE))
					.map((url) => url.pathname);
			})
		)
	).flat();
	await Promise.all([cache.put(ROOT, responses[0]), cache.put(CANVAS, responses[1])]);
	await cache.addAll([...new Set([...files, ...WORKERS, ...linked])]);
}

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then(cacheShell)
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	const url = new URL(event.request.url);
	if (url.origin !== sw.location.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			if (event.request.mode !== 'navigate' && url.pathname.startsWith(IMMUTABLE)) {
				const cached = await cache.match(event.request);
				if (cached) return cached;
			}
			try {
				const response = await fetch(event.request);
				if (response.ok) cache.put(event.request, response.clone());
				return response;
			} catch (err) {
				const cached =
					(await cache.match(event.request)) ??
					// offline navigation to any route falls back to the app shell
					(event.request.mode === 'navigate' ? await cache.match(ROOT) : undefined);
				if (cached) return cached;
				throw err;
			}
		})()
	);
});
