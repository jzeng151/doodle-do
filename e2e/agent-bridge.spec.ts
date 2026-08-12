import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createServer, type Server, type ServerResponse } from 'node:http';

const port = 43129;
const token = 'agent-bridge-test';
let server: Server;
let events: ServerResponse | null = null;
const pending = new Map<string, (value: unknown) => void>();

test.beforeAll(async () => {
	server = createServer(async (request, response) => {
		response.setHeader('Access-Control-Allow-Origin', request.headers.origin ?? '*');
		response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
		response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
		if (request.method === 'OPTIONS') return void response.writeHead(204).end();
		const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
		if (url.searchParams.get('token') !== token) return void response.writeHead(401).end();
		if (request.method === 'GET' && url.pathname === '/events') {
			response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
			response.write('event: ready\ndata: {}\n\n');
			events = response;
			return;
		}
		if (request.method === 'POST' && url.pathname === '/result') {
			const chunks: Buffer[] = [];
			for await (const chunk of request) chunks.push(Buffer.from(chunk));
			const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
			pending.get(body.id)?.(body);
			pending.delete(body.id);
			response.writeHead(200).end();
			return;
		}
		response.writeHead(404).end();
	});
	await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
});

test.afterAll(async () => {
	events?.end();
	await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

function call(operation: string, args: unknown): Promise<Record<string, unknown>> {
	if (!events) throw new Error('browser bridge is not connected');
	const id = randomUUID();
	return new Promise((resolve) => {
		pending.set(id, resolve);
		events!.write(
			`event: operation\ndata: ${JSON.stringify({ protocolVersion: 1, id, operation, args })}\n\n`
		);
	});
}

test('agent edit renders live and enters browser undo history', async ({ page }) => {
	await page.goto(`/canvas?mcp=${token}&mcpPort=${port}`);
	await page.locator('canvas.editor').waitFor();
	await expect.poll(() => events !== null).toBe(true);

	const described = await call('get_document', {});
	expect(described.ok).toBe(true);
	const version = (described.result as { version: number }).version;
	const edited = await call('apply_pixel_patch', {
		expectedVersion: version,
		frame: 0,
		layer: 0,
		edits: [{ x: 1, y: 1, value: 1 }]
	});
	expect(edited.ok).toBe(true);
	await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();

	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
});
